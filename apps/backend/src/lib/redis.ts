import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const PREFIX = "gdg-backend:";

export const redis = new Redis(REDIS_URL, {
    keyPrefix: PREFIX,
    // Add some default error handling to avoid crashing the server if Redis is down
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

redis.on("error", (err) => {
    console.error(`[Redis] Error:`, err);
});

redis.on("connect", () => {
    console.log(`[Redis] Connected to ${REDIS_URL}`);
});

/**
 * Helper to get a key with the internal prefix already applied by ioredis
 * Note: ioredis automatically handles the prefix if configured in the constructor
 */
export const getPrefixedKey = (key: string) => key;
