## Bookmarks Map

Aplicación web para transformar el archivo `Bookmarks` de Google Chrome en un mapa visual navegable.

### Requisitos
- Node.js 20+
- npm 10+

### Scripts principales
- `npm install` — instala dependencias.
- `npm run dev` — servidor de desarrollo con Vite.
- `npm run build` — valida tipos y genera la build optimizada.
- `npm run preview` — sirve la build generada localmente.
- `npm test` — ejecuta Vitest en modo unitario/integración.
- `npm run lint` / `npm run lint:fix` — ejecuta ESLint.
- `npm run format` / `npm run format:check` — formatea con Prettier.

### Estructura
- `src/` — código de la app (componentes, hooks, librerías).
- `public/` — assets estáticos y muestras (`data/sample-bookmarks.json`).
- `tests/` — pruebas unitarias (`lib`) y E2E (`e2e`), con fixtures.

### Desarrollo rápido
1. Clona el repositorio y ejecuta `npm install`.
2. Inicia el servidor con `npm run dev`.
3. Sube un archivo de marcadores o usa el ejemplo incluido para validar el flujo.
