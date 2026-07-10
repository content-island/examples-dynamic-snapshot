import {
  type ContentSnapshot,
  createClient,
} from '@content-island/api-client';
// El JSON se importa como módulo y queda incrustado en el bundle: se lee igual en local, al compilar y en Docker.
import snapshot from '../content-island-snapshot.json' with { type: 'json' };

const accessToken = process.env.CONTENT_ISLAND_TOKEN ?? 'snapshot-mode';

export const contentIslandClient = createClient({
  accessToken,
  mode: 'snapshot',
  snapshotLoader: async () => snapshot as ContentSnapshot,
});
