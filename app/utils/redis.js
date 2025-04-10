import Redis from "ioredis";

// read the base64 string from ENV
const base64Cert = process.env.REDIS_CA_BASE64;

// decode to a Buffer
const redisCaBuffer = Buffer.from(base64Cert, 'base64');

// Create a Redis client instance
const redis = new Redis({
    port: process.env.REDIS_PORT,  // Redis port
    host: process.env.REDIS_HOST,  // Redis host
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    tls: true,
    ca: [redisCaBuffer],
});

redis.on('error', (err) => {
    console.error('Redis error:', err);
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