import { contentIslandClient, ensureSnapshot } from './content-island';

export async function getHomeData() {
  await ensureSnapshot();
  const info = await contentIslandClient.getSnapshotInfo();

  // Cambia el contentType por el de tu proyecto (o quita el filtro para traer todo).
  const posts = await contentIslandClient.getContentList({ contentType: 'post' });

  return { exportedAt: info.exportedAt, count: posts.length };
}
