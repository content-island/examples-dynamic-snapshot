import { createClient, exportSnapshot } from '@content-island/api-client';

const accessToken = process.env.CONTENT_ISLAND_TOKEN!;

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
    snapshotLoader: async () => exportSnapshot({ accessToken }),
  });

globalForClient.contentIslandClient = contentIslandClient;

// Carga el snapshot la primera vez que se usa el cliente.
export function ensureSnapshot() {
  if (!globalForClient.primed) globalForClient.primed = contentIslandClient.refreshSnapshot();
  return globalForClient.primed;
}