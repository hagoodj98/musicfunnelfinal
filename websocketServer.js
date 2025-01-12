import { WebSocketServer } from 'ws';
import redis from './app/utils/redis';

const wss = new WebSocketServer({ port: 8080 });
    console.log('WebSocket server is running on port 8080');

    

wss.on('connection', ws => {

    ws.on('message', message => {
        console.log(`Received message: ${message}`);
    });
    ws.send('Hello! Message from server.');
});