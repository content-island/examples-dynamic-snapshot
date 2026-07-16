import { getHomeData } from '@/lib/content';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { exportedAt, count } = await getHomeData();

  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Content Island · Dynamic Snapshot</h1>
      <p>Snapshot exportado: <strong>{exportedAt}</strong></p>
      <p>Contenidos en memoria: <strong>{count}</strong></p>
      <p style={{ color: '#666' }}>
        Dispara un refresh y recarga esta página: <code>exportedAt</code> cambiará.
      </p>
    </main>
  );
}
