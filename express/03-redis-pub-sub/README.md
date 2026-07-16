# Express · Redis Pub/Sub · Dynamic Snapshot

Tercera variante del mismo ejemplo (junto a `tanstack-start/` y `next/`), esta vez
con **Express plano** en TypeScript. Mismo patrón: el snapshot vive en Redis y el
servidor se refresca solo vía pub/sub.

## Cómo funciona

- **`scripts/publish-redis.mts`** (publisher): exporta el snapshot desde Content
  Island, lo guarda en la key `content-island:snapshot` y publica un aviso en el
  canal `content-island:updated`.
- **`src/lib/content-island.ts`** (subscriber): el cliente lee el snapshot de Redis
  mediante `snapshotLoader`. Al primer uso (`ensureSnapshot`) se suscribe al canal y
  cada vez que llega un aviso llama a `refreshSnapshot()`.
- **`src/server.ts`**: API pura (sin UI). `GET /` devuelve `{ exportedAt, count }` en
  JSON, y `POST /api/content-island/refresh` (protegido por `x-refresh-secret`)
  fuerza un refresco manual.

## Uso

```bash
npm install
cp .env.example .env   # rellena CONTENT_ISLAND_TOKEN, REFRESH_SECRET, REDIS_URL

npm run publish:redis  # 1) publica el snapshot en Redis
npm run dev            # 2) arranca la API en http://localhost:3000
```

Consulta los datos:

```bash
curl http://localhost:3000/            # { "exportedAt": "...", "count": N }
```

Vuelve a lanzar `npm run publish:redis` y repite el `curl`: `exportedAt` cambiará
sin reiniciar el servidor.

Refresco manual:

```bash
curl -X POST http://localhost:3000/api/content-island/refresh \
  -H "x-refresh-secret: $REFRESH_SECRET"
```
