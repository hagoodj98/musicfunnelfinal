import dotenv from 'dotenv';
dotenv.config();

import redis from './app/utils/redis.js';
import { logEnvVars } from './app/utils/redis.js';
logEnvVars(); //This just confirms the variables are loaded in the time they are needed
import { WebSocketServer } from 'ws';
import { channel } from 'diagnostics_channel';

// Add any other critical environment variables here

const wss = new WebSocketServer({ port: 8080 });
console.log('WebSocket server is running on port 8080');


// Setup Redis subscriber
const redisSubscriber = redis.duplicate();
redisSubscriber.on('error', (err) => {
    console.error('Redis duplicate connection error:', err);
  });

// Function to ensure Redis client is connected
async function connectRedisSubscriber() {
    while (redisSubscriber.status !== 'ready') {
        try {
            await redisSubscriber.connect();
            console.log('Redis connected successfully.');
            //Once connected, subscribe to the channels
            await subscribeToChannels();
            break; // Exit loop once connected
        } catch (err) {
            console.error('Redis subscriber connection attempt failed:', err);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Retry after 2 seconds
        }
    }
}

async function subscribeToChannels() {
    try {
        await redisSubscriber.subscribe('statusUpdates', 'checkoutUpdates', (message) => {
            console.log('Received message from Redis:', message);
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message); 
                }
            })
        });
        console.log('Subscribed to Redis channels: statusUpdates, checkoutUpdates');
        
    } catch (error) {
        console.error('Failed to subscribe to Redis channels:', error);
    }
}

// Establish Redis connection
connectRedisSubscriber();

//This block of code sends messages directly to the client connection. This is outbound call to the client webSocket connection by sending the message
redisSubscriber.on('message', (channel, message) => {
    console.log(`Received message from ${channel}: ${message}`);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message); // Forward Redis message directly
        }
    });
});

//These are incoming messages from the client. This is the inbound call, This block of code is receiving messages from the client. Based on interaction of the application
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message)  {
        console.log(`Received WebSocket message: ${message}`);
        const data = JSON.parse(message);
        const { action, sessionToken } = data;

        // Handle message action types
        switch (action) {
            case 'heartbeat':
                // Update Redis with the latest activity timestamp and refresh TTL
                if (sessionToken) {
                    redis.set(`session:${sessionToken}`, 'active', 'EX', 3600); // 1 hour TTL
                    console.log(`Heartbeat received, session refreshed: ${sessionToken}`);
                }
                break;
            case 'checkoutInitiated':
            case 'checkoutCompleted':
            case 'checkoutCanceled':
                console.log(`${action} for session: ${sessionToken}`);
                // Additional logic based on action
                break;
            
            default:
                console.log('Received unknown action');
        }
    });
    ws.on('close', () => {
        console.log(`Client disconnected`);
    });
    
    ws.send('Hello! Message from server.');
});

// Ensure to handle cleanup on server shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    redisSubscriber.unsubscribe();
    redisSubscriber.quit();
    wss.close(() => {
        console.log('WebSocket server has been closed');
    });
    process.exit();
});