# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds TypeScript source. Group cross-cutting logic under `src/lib/`, UI widgets under `src/components/`, bookmark-specific flows under `src/features/bookmarks/`, and shared hooks in `src/hooks/`.
- `src/features/bookmarks/components/` expone `BookmarkTree` y `BookmarkKanbanBoard`; sincroniza ambas vistas cuando añadas nuevas capacidades o filtrados. El board soporta drill-down por migas, así que respeta la API (`nodes`, `trail`, `onOpenFolder`, `onNavigate`) al extenderlo.
- La búsqueda vive en `App.tsx` y filtra por título/URL. Cualquier cambio en la estructura debe mantener `filterNodes` alineado con las rutas que muestra el Kanban.
- `public/` stores static assets (favicons, manifest) y queda libre para configuraciones futuras.
- Configuration lives at the repository root (`vite.config.ts`, `tsconfig.json`, `.eslintrc.cjs`). Treat these as part of the codebase and review any changes carefully.

## Build & Development Commands
- Install dependencies with `npm install`.
- Start local development using `npm run dev`; la app procesa exportaciones HTML de Chrome mediante `FileReader` en el navegador.
- Produce an optimized build with `npm run build`; preview it locally using `npm run preview`.
- Lint with `npm run lint` (use `npm run lint:fix` for autofixes) and format with `npm run format`. CI runs `npm run format:check` to verify nothing is pending.
- Al subir un archivo, los datos se guardan en `localStorage` (clave `bookmarks-map.cache`) y se restauran al recargar. El botón “Olvidar archivo” debe limpiar tanto el estado como el almacenamiento.
- La vista seleccionada (árbol/kanban) se persiste en `localStorage` (`bookmarks-map.view-mode`); mantiene esa convención en futuras mejoras.
- No hay suites automáticas activas; documenta el smoke test manual (subir HTML + alternar vistas) en la descripción del PR.

## Coding Style & Naming Conventions
- Use TypeScript, 2-space indentation, and camelCase for variables, PascalCase for React components, and kebab-case for filenames.
- Prefer functional components with hooks over class components. Keep parsing logic pure and colocate utility functions under `src/lib/bookmarks.ts`.
- Prettier manages whitespace; ESLint enforces project rules. Run `npm run lint -- --fix` for minor corrections but review each change.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, etc.). Scope optional but encouraged (`feat(parser): handle folders`).
- Each PR should include: concise summary, list of changes, manual testing notes, and screenshots o GIFs para cambios visuales.
- Reference related issue numbers in PR bodies (`Closes #12`) and request at least one teammate review before merging.
