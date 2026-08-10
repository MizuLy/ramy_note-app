# Ramy Note App

A full-stack note-taking application ("RAM Shortage") with notes (rich-text, pin, folders, tags, trash, search), to-dos, journals, email-OTP auth, and an admin panel.

> For deep implementation details (data model, request flow, gotchas), see **[agent_guide.md](./agent_guide.md)**.

## Tech Stack

| Directory | Stack |
|-----------|-------|
| `backend/` | Node.js + Express 5, Prisma ORM, PostgreSQL, JWT, Cloudinary, Nodemailer/Resend |
| `frontend/` | React 19 + Vite, React Router 7, TipTap 3, Tailwind + daisyUI, Axios |

## Repository Structure

```
Ramy (Note-app)/
├── agent_guide.md              # detailed agent/onboarding guide
├── README.md                   # this file
├── backend/                    # Express REST API (CommonJS)
│   ├── docker-compose.yml      # PostgreSQL 15 + pgAdmin
│   ├── prisma.config.ts        # Prisma 6 config
│   ├── prisma/
│   │   ├── schema.prisma       # data model (Users, Notes, Todos, Journals, Tags, Folders, Otps)
│   │   └── migrations/         # migration history
│   ├── package.json            # "type": "commonjs", dev = nodemon src/server.js
│   └── src/
│       ├── server.js           # app entry, middleware, mounts routers at /api
│       ├── configs/            # db.js, cloudinary.js, upload.js (multer), otp.js
│       ├── controllers/        # per-feature request handlers (auth, note, todo, ...)
│       ├── middlewares/        # verifyToken, isAdmin, rateLimiter
│       ├── routes/             # Express routers (auth, otp, notes, folders, tags, todos, journals, admin)
│       └── utils/              # generateToken.js, sendMail.js
└── frontend/                   # React SPA (ESM)
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js      # custom zinc palette + fonts + daisyUI themes
    ├── package.json            # dev = vite, lint = eslint .
    └── src/
        ├── main.jsx            # BrowserRouter > AuthProvider > ThemeProvider
        ├── App.jsx             # all routes + toast config
        ├── index.css           # Tailwind + CSS variables (zinc palette)
        ├── api/
        │   ├── axios.js        # feature API wrappers (hardcoded http://localhost:6969)
        │   └── admin.js        # admin endpoints
        ├── assets/             # ram.png
        ├── components/         # Sidebar, modals/, ProtectedRoute, AdminRoute, AvatarUpload, RoleDropdown
        ├── context/            # AuthProvider, ThemeProvider
        ├── error/              # NotFound.jsx
        ├── layouts/            # AuthLayout, DashboardLayout, AdminLayout
        ├── pages/
        │   ├── auth/           # Login, Register, VerifyOTP, Setting, Logout
        │   ├── dashboard/      # Dashboard, note/ (Note, Trash, NoteList, NoteEditor), todo/, journal/ (Journal, JournalEditor, JournalList, JournalTrash)
        │   └── admin/          # AdminDashboard
        └── utils/              # localColors.js
```

## Getting Started

**Backend** (port 6969):
```bash
cd backend
docker compose up -d            # PostgreSQL 15 + pgAdmin
cp .env.example .env            # fill in secrets (see agent_guide.md)
npm install
npx prisma migrate dev
npm run dev
```

**Frontend** (port 5173):
```bash
cd frontend
npm install
npm run dev
```

Both apps must run together — backend CORS only allows `http://localhost:5173`. Run `npm run lint` in `frontend/` before finishing work.

## Key Conventions

- **API routes** are mounted under `/api`; responses vary per endpoint (`data`, `result`, `folder`, `journal`) — unwrap defensively (`res?.data || res?.result || res`).
- **Auth**: access token (1d, Bearer) + httpOnly refresh token cookie (7d). Frontend refreshes only once at boot; no 401 auto-refresh.
- **Notes & Journals**: body stores TipTap HTML (notes only); both use soft delete (`isDeleted`/`deletedAt`) with trash + restore + permanent-delete endpoints (`DELETE /:id` → trash, `/:id/restore`, `/:id/permanent`).
- **Editor sharing** (`editors` m2m on Notes) exists in schema/controller but has no UI yet — do not remove it.
- **First registered user** automatically becomes `ADMIN`.
- No TypeScript, no tests. Lint only on the frontend.
