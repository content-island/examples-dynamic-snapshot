import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { isApiClientError } from '@content-island/api-client';
import { contentIslandClient } from './content-island';

const app = new Hono();

app.use('/api/*', cors());

const fail = (err: unknown) => {
  if (isApiClientError(err)) {
    return Response.json(
      { error: err.code, message: err.message },
      { status: err.status },
    );
  }
  console.error(err);
  return Response.json(
    { error: 'INTERNAL_ERROR', message: 'Unexpected error' },
    { status: 500 },
  );
};

app.get('/health', (c) => c.json({ ok: true }));

app.get('/api/snapshot-info', async (c) => {
  try {
    return c.json(await contentIslandClient.getSnapshotInfo());
  } catch (err) {
    return fail(err);
  }
});

app.get('/api/contents', async (c) => {
  try {
    const contents = await contentIslandClient.getRawContentList({
      contentType: c.req.query('contentType'),
      language: c.req.query('language'),
    });

    return c.json(contents);
  } catch (err) {
    return fail(err);
  }
});

const port = Number(process.env.BACKEND_PORT ?? 3001);
const hostname = process.env.BACKEND_HOST ?? '0.0.0.0';

serve({ fetch: app.fetch, port, hostname }, ({ address, port }) => {
  console.log(`Content Island Hono backend listening on http://${address}:${port}`);
});
