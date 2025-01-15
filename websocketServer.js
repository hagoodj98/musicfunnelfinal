import dotenv from 'dotenv';
dotenv.config();

import redis from './app/utils/redis.js';
import { logEnvVars } from './app/utils/redis.js';
logEnvVars(); //This just confirms the variables are loaded in the time they are needed
import { WebSocketServer } from 'ws';

// Add any other critical environment variables here

const wss = new WebSocketServer({ port: 8080 });
console.log('WebSocket server is running on port 8080');

async function connectRedisClient(redisClient, maxRetries = 5) {
    let retries = 0;
    while (retries < maxRetries) {
        if (redisClient.status === 'ready') {
            console.log('Redis client is already ready.');
            return redisClient; // Client is already connected, exit the function
          }
          if (redisClient.status === 'connecting' || redisClient.status === 'connect') {
            console.log('Redis client is currently connecting.');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second to check again
            continue; // Skip the current loop iteration and check status again
          }
          try {
            console.log(`Attempting to connect Redis... Retry #${retries + 1}`);
            await redisClient.connect();
            console.log('Redis connected successfully.');
            return redisClient;  // Successfully connected, exit the function
          } catch (err) {
            console.error('Redis connection attempt failed:', err);
            if (retries === maxRetries - 1) {
                throw new Error('Maximum retries reached, failed to connect Redis.');
              }
              retries++;
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before next retry
        }
    }
}

// Setup Redis subscriber
const redisSubscriber = redis.duplicate();
redisSubscriber.on('error', (err) => {
    console.error('Redis duplicate connection error:', err);
  });
  
async function initializeRedis() {
    try {
        await connectRedisClient(redisSubscriber);
         // Proceed with using the connected Redis client
    // Subscribe to a channel or perform other Redis operations here
        await redisSubscriber.subscribe('statusUpdates', (message) => {
            console.log('Received message from Redis:', message);
            // Forward message to all connected WebSocket clients
            wss.clients.forEach((client) => {
                if(client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({type: 'statusUpdate', data: message }));
                }
            });
    });

    } catch (error) {
        console.error('Failed to establish Redis connection:', error);
    }
}
initializeRedis();

wss.on('connection', ws => {
    ws.on('message', message => {
        console.log(`Received message: ${message}`);
    });
    ws.send('Hello! Message from server.');
});
// Ensure to handle cleanup on server shutdown
process.on('SIGINT', () => {
    redisSubscriber.quit();
    wss.close(() => {
        console.log('WebSocket server has been closed');
    });
    process.exit();
});