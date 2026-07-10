# Parte 1 · Snapshot estático en local + Docker

Parte de la guía _Static Snapshot con TanStack Start + Hono_. Aquí el snapshot es un **fichero JSON estático** que bajas a mano y que se **inlinea en el bundle** del backend. El mismo fichero sirve tanto con `npm run dev` como levantando la app como servidor aparte (Docker).

Es un monorepo con dos workspaces:

- `apps/api` — backend **Hono** que sirve el snapshot (`:3001`).
- `apps/web` — front **TanStack Start** que lo pinta con un loader (`:3000`).

> El JSON vive en `apps/api/`, **no en `public/`**: no es un asset que el navegador descarga, sino datos que el backend mete en el bundle.

---

## 1. Bajar el fichero a una carpeta

Exporta el snapshot desde Content Island a `apps/api/` (necesitas un token de lectura):

```bash
export CONTENT_ISLAND_TOKEN=tu-token-de-lectura
npx content-island export \
  --access-token "$CONTENT_ISLAND_TOKEN" \
  --snapshot-path apps/api/content-island-snapshot.json
```

El repo ya trae un `content-island-snapshot.json` de ejemplo, así que puedes saltarte este paso la primera vez y arrancar directamente.

## 2. Cómo se lee el fichero

El cliente lo importa **como módulo**, así el bundler lo mete dentro del artefacto. No hay ruta de fichero que resolver en runtime: se lee igual en dev, tras el build y en el contenedor.

```ts
// apps/api/src/content-island.ts
import { type ContentSnapshot, createClient } from '@content-island/api-client';
import snapshot from '../content-island-snapshot.json' with { type: 'json' };

// En modo snapshot no se hace ninguna llamada al cliente, el token no se usa.
const accessToken = process.env.CONTENT_ISLAND_TOKEN ?? 'snapshot-mode';

export const contentIslandClient = createClient({
  accessToken,
  mode: 'snapshot',
  snapshotLoader: async () => snapshot as ContentSnapshot,
});
```

El backend Hono (`apps/api/src/server.ts`) expone `/api/snapshot-info` y `/api/contents` (más `/health` para el healthcheck de Docker).

## 3. El loader en el front

El loader de TanStack Start corre en el servidor y llama al backend Hono (server-to-server), el navegador nunca ve la URL del API.

```tsx
// apps/web/src/routes/index.tsx  (resumido)
const getHomeData = createServerFn({ method: 'GET' }).handler(async () => {
  const backendUrl = process.env.API_URL ?? 'http://localhost:3001';
  const [info, contents] = await Promise.all([
    fetchJson(`${backendUrl}/api/snapshot-info`),
    fetchJson(`${backendUrl}/api/contents`),
  ]);
  return { info, contents };
});

export const Route = createFileRoute('/')({
  loader: () => getHomeData(),
  component: Home,
});
```

## 4. Probarlo en local (`npm run dev`)

```bash
npm install
npm run dev
# api  -> http://localhost:3001   (Hono)
# web  -> http://localhost:3000   (TanStack Start)
```

Abre `http://localhost:3000`: verás el `exportedAt` del snapshot y el listado de contenidos que sirve el backend. Comprueba también el backend directo:

```bash
curl http://localhost:3001/health          # -> {"ok":true}
curl http://localhost:3001/api/snapshot-info
```

## 5. Probarlo como servidor aparte (Docker)

El mismo fichero, ahora en la imagen del backend:

```bash
docker compose up --build
# web -> http://localhost:3000   ·   api -> http://localhost:3001
```

`docker-compose.yml` levanta los dos servicios en una red interna: el `web` alcanza al `api` en `http://api:3001` (variable `API_URL`) y espera a su healthcheck antes de arrancar.

Para actualizar el contenido, vuelve al **paso 1** (re-exporta el JSON) y reconstruye. Automatizar ese export en CD y refrescar sin rebuild es lo que añade la [Parte 2](../05-static-cd-workflow).

---

## Referencias

- Content Island — [Snapshot mode](https://docs.contentisland.net/es/advanced/snapshot-mode/) ·
  [`exportSnapshot()`](https://docs.contentisland.net/es/client-api/export-snapshot/) ·
  [`getSnapshotInfo()`](https://docs.contentisland.net/es/client-api/get-snapshot-info/)
- [Hono](https://hono.dev/) ·
  [TanStack Start · Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
