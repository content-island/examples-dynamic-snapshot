# Express · Bucket S3 · Dynamic Snapshot

Variante con **Express plano** (API pura, sin UI) del ejemplo `02-bucket-s3`, junto a
`tanstack-start/` y `next/`. El snapshot se publica en un bucket S3 (aquí MinIO en
local) y la app lo lee vía HTTP; un webhook manual avisa para recargar en memoria.

## Cómo funciona

- **`scripts/publish-bucket.sh`** (publisher): exporta el snapshot desde Content
  Island, lo sube al bucket (`aws s3 cp` contra MinIO) y hace `POST` al endpoint de
  refresh de la app.
- **`src/lib/content-island.ts`** (loader): el cliente lee el snapshot del bucket con
  `fetch(SNAPSHOT_URL)`. `ensureSnapshot()` lo carga en memoria la primera vez.
- **`src/server.ts`**: API pura. `GET /` devuelve `{ exportedAt, count }`, y
  `POST /api/content-island/refresh` (protegido por `x-refresh-secret`) relee el
  snapshot del bucket a memoria.

## Requisitos

- Un bucket S3 compatible. En local, MinIO en `http://localhost:9000` con el bucket
  `content-island`, y `aws` CLI instalado.

## Uso

```bash
npm install
cp .env.example .env   # rellena CONTENT_ISLAND_TOKEN, REFRESH_SECRET y SNAPSHOT_URL

npm run dev            # 1) arranca la API en http://localhost:3000
npm run publish:bucket # 2) exporta, sube al bucket y avisa a la app
```

```bash
curl http://localhost:3000/            # { "exportedAt": "...", "count": N }
```

Vuelve a lanzar `npm run publish:bucket` y repite el `curl`: `exportedAt` cambiará
sin reiniciar el servidor.
