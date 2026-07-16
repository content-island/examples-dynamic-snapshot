import { createClient } from '@content-island/api-client';
import { redis, redisReady } from './redis';

const accessToken = process.env.CONTENT_ISLAND_TOKEN!;
const SNAPSHOT_KEY = 'content-island:snapshot';
const CHANNEL = 'content-island:updated';

// Express runs as a single, long-lived process, so a module-level singleton is
// enough to share one client (and one in-memory snapshot) across all requests.
export const contentIslandClient = createClient({
  accessToken,
  mode: 'snapshot',
  // The loader reads the snapshot from Redis.
  snapshotLoader: async () => {
    await redisReady;
    return (await redis.get(SNAPSHOT_KEY)) ?? '';
  },
});

// On first use this instance subscribes to the channel and refreshes itself
// whenever the publisher signals. It also performs the initial snapshot load.
let primed: Promise<unknown> | null = null;
export function ensureSnapshot() {
  if (!primed) {
    primed = (async () => {
      await redisReady;
      // A Redis connection can't both subscribe and run commands, so the
      // subscriber uses its own duplicated connection.
      const sub = redis.duplicate();
      sub.on('error', (err) => console.error('Redis subscriber error', err));
      await sub.connect();
      await sub.subscribe(CHANNEL, () => {
        contentIslandClient.refreshSnapshot().catch(console.error);
      });
      await contentIslandClient.refreshSnapshot(); // initial load
    })().catch((err) => {
      // Don't cache the failure: if the snapshot doesn't exist in Redis yet,
      // the next request retries instead of reusing a rejected promise.
      primed = null;
      throw err;
    });
  }
  return primed;
}
