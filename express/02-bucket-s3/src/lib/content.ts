import { contentIslandClient, ensureSnapshot } from './content-island';

export async function getHomeData() {
  await ensureSnapshot();
  const info = await contentIslandClient.getSnapshotInfo();

  // Swap 'post' for a content type in your project (or drop the filter to fetch everything).
  const posts = await contentIslandClient.getContentList({ contentType: 'post' });

  return { exportedAt: info.exportedAt, count: posts.length };
}
