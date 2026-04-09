import Redis from "ioredis";

// Decode custom CA cert if provided (self-hosted Redis with custom TLS)
const base64Cert = process.env.REDIS_CA_BASE64;
const redisCaBuffer = base64Cert
  ? Buffer.from(base64Cert, "base64")
  : undefined;

// Build TLS config:
//   - REDIS_CA_BASE64 set  → TLS with custom CA (self-hosted)
//   - REDIS_TLS=true       → standard TLS (Redis Cloud / managed providers)
//   - neither              → no TLS (local development)
const tlsConfig = redisCaBuffer
  ? { tls: { ca: [redisCaBuffer] } }
  : process.env.REDIS_TLS === "true"
    ? { tls: {} }
    : {};

const redis = new Redis({
  port: parseInt(process.env.REDIS_PORT || "6379"),
  host: process.env.REDIS_HOST,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  ...tlsConfig,
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

async function checkRedisConnection() {
  try {
    await redis.set("test", "value");
    const value = await redis.get("test");
    console.log("Redis Test Value:", value);
    if (value === "value") {
      console.log("Connection to Redis is successful and working.");
    } else {
      console.log("Failed to retrieve the correct value from Redis.");
    }
  } catch (error) {
    console.error("Error connecting to Redis:", error);
  }
}

checkRedisConnection();

export default redis;
