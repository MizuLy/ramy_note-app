# Repository Guidelines

## Project Structure & Module Organization

This repository is the React/Vite frontend for the note application. Application bootstrapping and global styles are in `src/main.jsx` and `src/index.css`. Organize reusable UI in `src/components/`, route-level screens in `src/pages/`, shared layouts in `src/layouts/`, authentication and theme state in `src/context/`, API clients in `src/api/`, and small helpers in `src/utils/`. Note and journal screens live under `src/pages/dashboard/`; authentication screens live under `src/pages/auth/`. Place static, publicly served files in `public/` and imported images or other bundled assets in `src/assets/`.

## Build, Test, and Development Commands

- `npm install` — install the locked dependency set.
- `npm run dev` — start the Vite development server with hot reload.
- `npm run build` — create the production bundle in `dist/`.
- `npm run preview` — serve the production bundle locally for verification.
- `npm run lint` — run ESLint across the project.

There is currently no automated test framework or `npm test` script. Before running the app, provide `VITE_API_URL` in a local `.env` file; never commit credentials or local environment files.

## Coding Style & Naming Conventions

Use JavaScript/JSX with two-space indentation, semicolon-free statements, and single quotes, matching the existing ESLint configuration. Use PascalCase for React component files and component names (for example, `NoteEditor.jsx`), camelCase for functions and variables, and descriptive route or feature directories. Keep API access in `src/api/` and avoid duplicating request logic in page components. Run `npm run lint` before submitting changes.

## Testing Guidelines

No test tooling or coverage threshold is configured. For UI changes, manually exercise the affected route, authentication state, responsive layout, and API error/loading states against the development server. Use the production build and `npm run preview` when validating deployment-sensitive changes.

## Commit & Pull Request Guidelines

Recent commits use short, imperative, feature-oriented subjects such as `feat: add health check`, `redesign: sidebar`, and `patch: reduce sidebar icons sizes`. Follow that style, keep each commit focused, and use a conventional prefix when appropriate (`feat:`, `fix:`, `patch:`, `redesign:`). Pull requests should explain the user-visible change, identify affected routes, link related issues when available, include screenshots or recordings for visual changes, and mention lint/build validation.
