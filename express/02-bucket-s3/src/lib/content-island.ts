import { createClient } from '@content-island/api-client';

const accessToken = process.env.CONTENT_ISLAND_TOKEN!;

// Express runs as a single, long-lived process, so a module-level singleton is
// enough to share one client (and one in-memory snapshot) across all requests.
export const contentIslandClient = createClient({
  accessToken,
  mode: 'snapshot',
  // The loader reads the snapshot from the bucket (S3/MinIO) over HTTP.
  snapshotLoader: async () => {
    const res = await fetch(process.env.SNAPSHOT_URL!, { cache: 'no-store' });
    if (!res.ok) {
      // Fail loudly: otherwise the error body (e.g. a 403 XML page) would be
      // handed to the client as if it were the snapshot.
      throw new Error(`Failed to fetch snapshot: ${res.status} ${res.statusText}`);
    }
    return res.text();
  },
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
