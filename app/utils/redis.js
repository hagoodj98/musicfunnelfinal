import Redis from "ioredis";
import fs from 'fs';



// Create a Redis client instance
const redis = new Redis({
    port: process.env.REDIS_PORT,  // Redis port
    host: process.env.REDIS_HOST,  // Redis host
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {
        ca: process.env.CERT_REDIS ? fs.readFileSync(process.env.CERT_REDIS) : undefined
      } : undefined
});

export function logEnvVars() {
console.log({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    certificatePath: process.env.CERT_REDIS
});
}
redis.on('error', (err) => {
    console.error('Redis error:', err);
    console.log('Failed command details:', err.command);
    
}); 

async function checkRedisConnection() {
    try {
        await redis.set('test', 'value');
        const value = await redis.get('test');
        console.log('Redis Test Value:', value);
        if(value === 'value') {
            console.log('Connection to Redis is successful and working.');
        } else {
            console.log('Failed to retrieve the correct value from Redis.');
        }
    } catch (error) {
        console.error('Error connecting to Redis:', error);
    }
  }
  
  checkRedisConnection();
  
export default redis;