import { createClient as createRedis } from 'redis';

export const redis = createRedis({ url: process.env.REDIS_URL });

// node-redis throws on unhandled 'error' events; log them so a dropped
// connection doesn't crash the process.
redis.on('error', (err) => console.error('Redis error', err));

export const redisReady = redis.connect();
