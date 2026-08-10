# Agent Guide — Ramy Note App

This guide helps AI agents (and new developers) understand the **Ramy Note App** codebase before making changes.

> Quick overview, structure, and setup commands are in the repo **[README.md](./README.md)** — this guide covers the deep implementation details.

## 1. Project Overview

A full-stack note-taking application ("RAM Shortage") with:

- **Notes** — rich-text editing (TipTap), pinning, folders, tags, soft-delete trash, search, word count / read-time.
- **To-dos** — simple task list with due dates and done-state toggling.
- **Journals** — mood-based diary entries with active/trash views, restore, and permanent delete (fully implemented).
- **Auth** — register with email OTP verification, login, JWT access + refresh tokens, profile settings (name/email/password/avatar).
- **Admin panel** — dashboard stats, list all users/notes, change roles, remove users.

Two separate apps live in a single repo:

| Directory | Stack |
|-----------|-------|
| `backend/` | Node.js + Express 5, Prisma ORM, PostgreSQL, JWT, Cloudinary, Nodemailer/Resend |
| `frontend/` | React 19 + Vite 8, React Router 7, TipTap 3, Tailwind + daisyUI, Axios |

## 2. Getting Started (Local Dev)

Backend (default port **6969**):

```bash
cd backend
docker compose up -d            # PostgreSQL 15 + pgAdmin (db: dev-db, user/pass: postgres/admin)
cp .env.example .env            # fill in values (see "Environment Variables")
npm install
npx prisma migrate dev          # apply schema + generate client
npm run dev                     # nodemon src/server.js
```

Frontend (default port **5173**):

```bash
cd frontend
npm install
npm run dev                     # vite
npm run lint                    # eslint .   (run before finishing work)
npm run build
```

CORS on the backend only allows `http://localhost:5173` with credentials — both apps must run for the UI to work.

### Environment Variables (backend `.env`)

- `DATABASE_URL` — Postgres connection string used by Prisma.
- `DOCKER_URL` — commented-out alternative datasource URL (uncomment in `prisma/schema.prisma` to use).
- `PORT`, `NODE_ENV` (production enables secure cookies + Resend).
- `ACCESS_SECRET` / `REFRESH_SECRET` / `JWT_EXPIRES_IN` — JWT secrets and refresh lifetime (default `7d`).
- `SMTP_USER` / `SMTP_PASS` — Gmail app password for Nodemailer (dev).
- `RESEND_API_KEY` — used instead of Nodemailer when `NODE_ENV === "production"`.
- Note: `configs/cloudinary.js` reads `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` even though they are not listed in `.env.example`.

## 3. Repository Layout

```
Ramy (Note-app)/
├── README.md                 # quick overview, structure, setup
├── agent_guide.md            # this file (deep implementation details)
├── backend/
│   ├── docker-compose.yml    # postgres + pgadmin
│   ├── prisma/
│   │   ├── schema.prisma     # data model
│   │   └── migrations/       # migration history
│   ├── prisma.config.ts      # Prisma 6 config (schema + datasource)
│   └── src/
│       ├── server.js         # app entry, middleware, route mounting
│       ├── configs/          # db.js (Prisma client), cloudinary.js, upload.js (multer), otp.js
│       ├── controllers/      # request handlers per feature
│       ├── middlewares/      # verifyToken, isAdmin, rateLimiter
│       ├── routes/           # Express routers per feature
│       └── utils/            # generateToken.js, sendMail.js
└── frontend/
    ├── vite.config.js
    ├── tailwind.config.js    # custom zinc palette + fonts + daisyUI themes
    └── src/
        ├── main.jsx          # providers: BrowserRouter > AuthProvider > ThemeProvider
        ├── App.jsx           # all routes + toast config
        ├── index.css         # Tailwind + zinc CSS variables
        ├── api/              # axios.js (feature APIs), admin.js
        ├── assets/           # ram.png
        ├── components/       # Sidebar, modals/, ProtectedRoute, AdminRoute, AvatarUpload, RoleDropdown
        ├── context/          # AuthProvider, ThemeProvider
        ├── error/            # NotFound.jsx
        ├── layouts/          # AuthLayout, DashboardLayout, AdminLayout
        ├── pages/            # auth/, dashboard/ (note/, todo/, journal/), admin/
        └── utils/            # localColors.js
```

## 4. Data Model (backend/prisma/schema.prisma)

Prisma client provider is `prisma-client-js`, datasource `postgresql`. All IDs are UUID strings. All `@relation(...)` relations have `onDelete: Cascade` (except note→folder, which is `SetNull`).

- **Users** — `name`, unique `email`, hashed `password`, optional `image` (Cloudinary URL), `role` (`RoleList`: `ADMIN` | `USER`), `isVerified` (email OTP). First registered user auto-becomes `ADMIN` (`userCount === 0` in `auth.controller.js:46`).
- **Notes** — optional `title`/`body` (body stores TipTap HTML), `isPinned`, soft delete via `isDeleted` + `deletedAt`, optional `folderId`. Owner relation `"Owner"`; implicit many-to-many `editors` (`"Editor"`) for shared editing; implicit m2m with `Tags`.
- **Todos** — `title`, `isDone`, optional `dueDate`.
- **Journals** — optional `title`, required `body`, optional `mood` (`Mood` enum: HAPPY, SAD, TIRED, ANXIOUS, EXCITED, NEUTRAL), `entryDate`, soft delete via `isDeleted`/`deletedAt`.
- **Tags** — `tag` + `userId`, `@@unique([tag, userId])`. Connected to notes via implicit m2m.
- **Folders** — just `name` + `userId`. Deleting a folder sets its notes' `folderId` to `null` (transaction in `folder.controller.js:96`).
- **Otps** — `email`, `otp`, `expiresAt` (5 min), not tied to a user row.

The editor m2m on Notes (`editors`) exists in the schema and the note controller authorizes editors, but **no API or UI exposes sharing yet** — do not remove it, it is a planned feature.

## 5. Backend Architecture

### Request flow

`server.js` mounts routers at `/api/...`. Middleware chain: `cors` → `express.json()` → `morgan` → `cookieParser` → `generalLimiter`. Every protected route runs `verifyToken`, which reads the access token from `Authorization: Bearer <token>` (or cookie fallback) and sets `req.user` to the full Prisma user row.

### Auth flow (important)

- `POST /api/auth/register` → hashes password, creates user (role ADMIN if first), sends 4-digit OTP email, does NOT log in.
- `POST /api/otp/request` & `POST /api/otp/verify` → verify sets `isVerified: true`.
- `POST /api/auth/login` → checks `isVerified`, returns `{ accessToken, data: {id, name, email, image, role} }` and sets an httpOnly `refreshToken` cookie (7d, `sameSite: strict`). The frontend `Login` page normalizes `image`/`avatar` before storing the user.
- `POST /api/auth/refresh` → reads cookie, returns a new `accessToken` + user object. The frontend calls this on app mount to restore the session.
- Access token expires in 1 day (`utils/generateToken.js`). There is currently **no automatic access-token refresh on 401 in the frontend**; `AuthProvider` only refreshes once at boot.

### API routes (all mounted under `/api`)

| Route | Methods | Notes |
|-------|---------|-------|
| `/auth` | refresh, register, login, logout, current-user, change-name, change-email, change-password, change-avatar (multipart) | avatar via multer→Cloudinary |
| `/otp` | request, verify | |
| `/notes` | GET list, POST, GET `/:id`, PUT `/:id`, PATCH `/:id` (togglePin), DELETE `/:id` (soft delete), `/:id/restore`, `/:id/permanent` | supports `?trash=true`, `?tag=`, `?pinned=`, `?search=`, pagination |
| `/folders` | GET list, POST, GET `/:id`, PATCH `/:id`, DELETE `/:id` | |
| `/tags` | GET list, POST, PATCH `/:id`, DELETE `/:id` | |
| `/todos` | GET list, POST, PATCH `/:id`, `/:id/toggle`, DELETE `/:id` | |
| `/journals` | GET list, POST, GET `/:id`, PUT `/:id`, DELETE `/:id` (soft delete), `/:id/restore`, `/:id/permanent` | supports `?trash=true` |
| `/admin/dashboard` | dashboard-stats, all-users, all-notes, change-user `/:id`/role, remove-user `/:id` | verifyToken + isAdmin |

### Key conventions in controllers

- Responses are wrapped as `{ status: "success", message?, data? | result? | folder? | journal? }`. The response key varies by endpoint (`data`, `result`, `folder`, `journal`) — frontend helpers defensively unwrap all of them (`res?.data || res?.result || res`).
- Errors: `{ error: "message" }` with 4xx/5xx status.
- Ownership checks are done per-resource (compare `req.user.id`). Notes also allow editors.

### Middlewares

- `verifyToken.js` — Bearer or cookie token → `req.user`.
- `isAdmin.js` — blocks non-ADMIN (`403`).
- `rateLimiter.js` — `generalLimiter` (10k/15min, global), `authLimiter` (50/15min, login/register), `otpLimiter` (3/5min, OTP request).

### Configs & utils

- `configs/db.js` — Prisma client singleton (`prisma`).
- `configs/upload.js` + `cloudinary.js` — multer with Cloudinary storage, folder `ramy-note-app/avatars`, 300×300 fill crop.
- `utils/sendMail.js` — `sendOtp` / `sendSuccess`; uses Resend in production, Nodemailer Gmail otherwise.
- `utils/generateToken.js` — access (1d) + refresh (7d, sets cookie) tokens.

## 6. Frontend Architecture

### Providers & routing (`main.jsx`, `App.jsx`)

```
BrowserRouter > AuthProvider > ThemeProvider > App
```

Routes in `App.jsx`:
- **AuthLayout**: `/login`, `/register`, `/verify-otp`
- **DashboardLayout** (wrapped in `ProtectedRoute`): `/` (welcome), `/notes/:id?`, `/folders/:folderId/:noteId?`, `/tags/:tagId/:noteId?`, `/trash/:id?` (renders the dedicated `Trash` page), `/todos`, `/journals`, `/journal`, `/journal/:id`, `/journal/trash`, `/journal/trash/:id`, `/settings`
- **AdminLayout** (wrapped in `AdminRoute`): `/admin`
- `*` → `NotFound.jsx`

### Contexts

- `AuthProvider` — holds `accessToken`, `user`, `loading`. On mount calls `/auth/refresh` to restore the session and normalizes `image`/`avatar` keys. No interceptor logic exists for token refresh-on-401.
- `ThemeProvider` — `light` / `dark` / `black` / `system`; sets `data-theme` attribute and toggles `.dark` class. `system` listens to `prefers-color-scheme`.

### API layer (`src/api/axios.js`)

Plain axios wrappers (not a shared instance). Every authed call passes `Authorization: Bearer <accessToken>` and `withCredentials: true` (needed for refresh cookie). Base URLs are hardcoded to `http://localhost:6969`.

### Pages

- **note/** — `Note.jsx` (container: two-pane list + editor, route-based selection), `Trash.jsx` (same two-pane layout for `/trash`, wires `NoteList` + `NoteEditor` with `isTrash`), `NoteList.jsx` (search, time filters, pin, trash actions), `NoteEditor.jsx` (TipTap rich text editor).
  - **Autosave**: `NoteEditor` debounces saves by 800ms via refs (`titleRef`, `isPinnedRef`, `selectedTagsRef`, `activeNoteIdRef`) so stale closures don't clobber newer content. Editor content is stored as HTML in `notes.body`.
  - **Trash mode**: `NoteEditor` takes an `isTrash` prop — the toolbar hides pin / folder / new-note actions and instead offers Restore + Delete Forever (permanent delete is confirmed via `ConfirmModal`). Trash notes are fetched with `getNoteId(id, token, { trash: true })`.
  - Folder/tag filtering on the list is done **client-side** after fetching all notes (with `?trash=true` passed for the trash view).
- **todo/** — `Todo.jsx` fully implemented (add, toggle, delete, filter tabs, optimistic UI with revert).
- **journal/** — fully implemented. `Journal.jsx` (container: fetches active + trash lists via `Promise.all`, active/trash view toggle, create/edit/soft-delete/restore/permanent-delete handlers), `JournalEditor.jsx`, `JournalList.jsx` (search, edit, soft-delete), `JournalTrash.jsx` (restore + permanent delete). Trash journals are fetched with `getJournals(token, { trash: true })`.
- **auth/** — Login (normalizes `image`/`avatar` on sign-in), Register, VerifyOTP, Setting (profile changes), Logout.
- **admin/** — `AdminDashboard.jsx` uses `src/api/admin.js`.

### Components

- `Sidebar.jsx` — collapsible nav (persisted in localStorage) with a Trash link, folders + tags sections with create/edit/delete modals and a right-click context menu. Folder/tag colors come from `utils/localColors.js` (localStorage map keyed by id). Admin link shown only when `user.role === "ADMIN"`.
- `modals/` — `FolderModal`, `DeleteFolderModal` (mode: delete notes or keep them), `TagModal`, `DeleteTagModal`, `SearchModal`, `ConfirmModal` (generic destructive-action confirm, replaces `window.confirm` for permanent note delete).
- `ProtectedRoute.jsx` / `AdminRoute.jsx` — auth / role guards (redirect to login/admin home as appropriate).
- `AvatarUpload.jsx`, `RoleDropdown.jsx` — used in settings / admin pages.

### Styling

- Tailwind with a **custom zinc palette** (950/900/800/700/500/400/200/100) backed by CSS variables in `src/index.css`; arbitrary values like `zinc-600`, `zinc-300` are **not** defined and should be avoided.
- daisyUI themes: `light`, `dark`, `black`. Fonts: Belanosima, Instrument Sans, Josefin Sans, Noto Sans Khmer, Comfortaa.
- Icons: `react-icons` — `Lu*` (lucide) is the dominant family; some `Io5`, `Pi`, `Go`, `Ri` icons appear in the Sidebar. `react-hot-toast` is the toast library.

## 7. Conventions & Gotchas

- **No TypeScript, no tests.** Lint only: `npm run lint` in `frontend/`. The backend has no lint/test setup (`npm test` is a stub).
- **CommonJS backend** (`"type": "commonjs"`), ESM frontend.
- **Prisma 6**: config lives in `prisma.config.ts`; run `npx prisma migrate dev` after schema changes and regenerate the client.
- **Response shapes differ per endpoint** — always unwrap defensively (`res?.data || res?.result || res`).
- **API base URLs are hardcoded** to `http://localhost:6969` in `frontend/src/api/axios.js` and `frontend/src/api/admin.js`. There is no Vite proxy / env-based URL config.
- **Note body is HTML** (TipTap). Never render note previews with `dangerouslySetInnerHTML` without sanitizing; previews strip HTML via DOMParser (`NoteList.jsx:21`).
- **Session caveat**: access token is only refreshed once at boot (`AuthProvider`). If a 401 occurs mid-session, the app does not auto-refresh — user must reload/login again.
- **Soft delete**: notes use `isDeleted`/`deletedAt`; permanent delete requires the note to already be in the trash (`note.controller.js:289`).
- **First registered user** becomes ADMIN automatically; guard rails in `admin.controller.js` prevent an admin from deleting their own account.
- **Journals** use the same soft-delete pattern as notes: `isDeleted`/`deletedAt`, `DELETE /:id` moves to trash, `PATCH /:id/restore` restores, `DELETE /:id/permanent` requires the journal to already be in the trash (`journal.controller.js:145`).
- Do not add code comments unless the surrounding code already uses them sparingly (the codebase uses minimal comments).
