import Redis from "ioredis";

// Create a Redis client instance
const redis = new Redis(); // Defaults to localhost:6379

export default redis;