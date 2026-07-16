import { createClient, exportSnapshot } from '@content-island/api-client';

const accessToken = process.env.CONTENT_ISLAND_TOKEN!;

// Express runs as a single, long-lived process, so a module-level singleton is
// enough to share one client (and one in-memory snapshot) across all requests.
export const contentIslandClient = createClient({
  accessToken,
  mode: 'snapshot',
  // The loader pulls the snapshot straight from the Content Island API.
  snapshotLoader: async () => exportSnapshot({ accessToken }),
});

// Loads the snapshot into memory the first time the client is used.
let primed: Promise<unknown> | null = null;
export function ensureSnapshot() {
  if (!primed) {
    primed = contentIslandClient.refreshSnapshot().catch((err) => {
      // Don't cache the failure: a transient error shouldn't break the server
      // permanently. Reset so the next request retries instead of reusing a
      // rejected promise.
      primed = null;
      throw err;
    });
  }
  return primed;
}
