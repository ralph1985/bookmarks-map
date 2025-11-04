# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds TypeScript source. Group cross-cutting logic under `src/lib/`, UI widgets under `src/components/`, bookmark-specific flows under `src/features/bookmarks/`, and shared hooks in `src/hooks/`.
- `public/` stores static assets (favicons, manifest, bookmark samples in HTML). Keep large fixture files under `public/data/`.
- `tests/` aggregates unit and integration suites, mirroring the folder layout in `src/`. End-to-end specs live in `tests/e2e/` and use the same filenames as their feature counterparts.
- Configuration lives at the repository root (`vite.config.ts`, `tsconfig.json`, `.eslintrc.cjs`). Treat these as part of the codebase and review any changes carefully.

## Build, Test, and Development Commands
- Install dependencies with `npm install`.
- Start local development using `npm run dev`; the app reads Chrome bookmark exports (HTML Netscape) via in-browser `FileReader`.
- Produce an optimized build with `npm run build`; preview it locally using `npm run preview`.
- Run unit and integration suites with `npm test`; pass `--watch` when iterating on parsing utilities.
- Lint with `npm run lint` (use `npm run lint:fix` for autofixes) and format with `npm run format`. CI runs `npm run format:check` to verify nothing is pending.

## Coding Style & Naming Conventions
- Use TypeScript, 2-space indentation, and camelCase for variables, PascalCase for React components, and kebab-case for filenames except `*.test.tsx`.
- Prefer functional components with hooks over class components. Keep parsing logic pure and colocate utility functions under `src/lib/bookmarks.ts`.
- Prettier manages whitespace; ESLint enforces project rules. Run `npm run lint -- --fix` for minor corrections but review each change.

## Testing Guidelines
- Unit tests rely on Vitest with Testing Library; add one test case per branch in parsing helpers, using HTML fixtures under `tests/fixtures/`.
- For UI flows, create Playwright specs in `tests/e2e/` that upload sample bookmark files and assert rendered tree nodes.
- Name test files `<feature>.test.ts[x]` and mirror folder structure. Target >85% coverage on parsing utilities and >70% on React components.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, etc.). Scope optional but encouraged (`feat(parser): handle folders`).
- Each PR should include: concise summary, list of changes, testing evidence (`npm test`, `npm run lint` output), and screenshots or GIFs for UI updates.
- Reference related issue numbers in PR bodies (`Closes #12`) and request at least one teammate review before merging.
