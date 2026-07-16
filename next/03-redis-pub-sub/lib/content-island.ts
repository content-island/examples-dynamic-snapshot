import { createClient } from '@content-island/api-client';
import { redis, redisReady } from './redis';

const accessToken = process.env.CONTENT_ISLAND_TOKEN!;
const SNAPSHOT_KEY = 'content-island:snapshot';
const CHANNEL = 'content-island:updated';

// Guardamos el cliente en globalThis para que la API de refresco y la página
// usen la misma instancia y, por tanto, el mismo snapshot en memoria.
const globalForClient = globalThis as unknown as {
  contentIslandClient?: ReturnType<typeof createClient>;
  primed?: Promise<unknown> | null;
};

export const contentIslandClient =
  globalForClient.contentIslandClient ??
  createClient({
    accessToken,
    mode: 'snapshot',
    // El loader lee el snapshot de Redis.
    snapshotLoader: async () => {
      await redisReady;
      return (await redis.get(SNAPSHOT_KEY)) ?? '';
    },
  });

globalForClient.contentIslandClient = contentIslandClient;

// Al primer uso, esta instancia se suscribe al canal y se refresca sola cada
// vez que el publisher avisa. También hace la carga inicial del snapshot.
export function ensureSnapshot() {
  if (!globalForClient.primed) {
    globalForClient.primed = (async () => {
      await redisReady;
      const sub = redis.duplicate();
      await sub.connect();
      await sub.subscribe(CHANNEL, () => {
        contentIslandClient.refreshSnapshot().catch(console.error);
      });
      await contentIslandClient.refreshSnapshot(); // carga inicial
    })().catch((err) => {
      // No cacheamos el fallo: si el snapshot aún no existe en Redis, el
      // siguiente request lo reintenta en vez de reusar una promesa rechazada.
      globalForClient.primed = null;
      throw err;
    });
  }
  return globalForClient.primed;
}
