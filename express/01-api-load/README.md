# Express · API Load · Dynamic Snapshot

Variante con **Express plano** (API pura, sin UI) del ejemplo `01-api-load`, junto a
`tanstack-start/` y `next/`. La forma más simple: el snapshot se trae directamente de
la API de Content Island (sin bucket ni Redis).

## Cómo funciona

- **`src/lib/content-island.ts`**: el cliente en modo `snapshot` usa un `snapshotLoader`
  que llama a `exportSnapshot()` contra la API de Content Island. `ensureSnapshot()`
  carga el snapshot en memoria la primera vez que se usa el cliente.
- **`src/server.ts`**: API pura. `GET /` devuelve `{ exportedAt, count }`, y
  `POST /api/content-island/refresh` (protegido por `x-refresh-secret`) fuerza una
  recarga del snapshot en memoria.

## Uso

```bash
npm install
cp .env.example .env   # rellena CONTENT_ISLAND_TOKEN y REFRESH_SECRET

npm run dev            # arranca la API en http://localhost:3000
```

```bash
curl http://localhost:3000/            # { "exportedAt": "...", "count": N }

curl -X POST http://localhost:3000/api/content-island/refresh \
  -H "x-refresh-secret: $REFRESH_SECRET"
```
