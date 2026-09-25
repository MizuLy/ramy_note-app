# Repository Guidelines

## Project Structure & Module Organization

This repository contains the backend API for the note application. `src/server.js` creates the Express server and mounts API routes. Feature endpoints are in `src/routes/`, handlers are in `src/controllers/`, and shared request logic is in `src/middlewares/` (authentication, validation, rate limiting, and admin checks). Helpers live in `src/utils/`; integrations and configuration are in `src/configs/`. Prisma models and migrations are under `prisma/`, with the schema in `prisma/schema.prisma`. Use `.env.example` as the local configuration template; never commit `.env` values.

## Build, Test, and Development Commands

Install dependencies with `npm install`.

- `npm run dev` starts the API with Nodemon and reloads on changes.
- `npm start` runs `src/server.js` directly.
- `docker compose up -d postgres` starts local PostgreSQL.
- `npx prisma generate` regenerates the Prisma client after schema changes.
- `npx prisma migrate dev --name <description>` creates and applies a development migration.
- `npm test` is a placeholder and exits with an error because no test runner is configured.

## Coding Style & Naming Conventions

Use CommonJS (`require`/`module.exports`) and two-space indentation, matching the existing JavaScript. Use `camelCase` for variables, functions, and files; use names such as `note.controller.js` and `verifyToken.js`. Keep routes thin, put business logic in controllers, validate external input with Zod, and use consistent async error handling. No formatter or linter is configured.

## Testing Guidelines

There are no repository tests yet. When adding tests, use a `test/` or `tests/` directory and names such as `auth.test.js` or `note.controller.test.js`. Add the chosen framework and scripts to `package.json`, and cover authentication, validation, authorization, and database behavior before merging.

## Commit & Pull Request Guidelines

Recent commits use short, imperative descriptions, sometimes prefixed with `feat/`, `feat:`, `add:`, `patch:`, or `redesign:` (for example, `feat: add health check`). Follow that concise style and keep each commit focused. Pull requests should explain the behavior change, identify API or migration impact, link a related issue when applicable, and include setup or verification steps. Include screenshots only when a backend change affects an observable dashboard or API documentation.

## Security & Configuration

Keep secrets, JWT keys, database credentials, and Cloudinary/Brevo keys in environment variables. Review CORS origins, rate limits, and authentication middleware when changing endpoints. Do not commit `.env`, generated secrets, or production data.
