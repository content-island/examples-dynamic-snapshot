import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import { getHomeData } from './lib/content';
import { contentIslandClient } from './lib/content-island';

const app = express();

// GET / -> returns the snapshot data as JSON (pure API, no UI).
app.get('/', async (_req, res, next) => {
  try {
    const data = await getHomeData(); // { exportedAt, count }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/content-island/refresh -> re-reads the snapshot from the bucket into memory.
app.post('/api/content-island/refresh', async (req, res, next) => {
  try {
    if (req.get('x-refresh-secret') !== process.env.REFRESH_SECRET) {
      res.status(401).send('Unauthorized');
      return;
    }
    const result = await contentIslandClient.refreshSnapshot();
    res.json(result); // { status: 'updated' | 'unchanged', meta }
  } catch (err) {
    next(err);
  }
});

// Return JSON on errors instead of Express's default HTML error page.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
};
app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`▶ http://localhost:${port}`);
});
