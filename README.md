# BookIt — Booking & Scheduling Platform

A full-stack booking and scheduling platform for small service businesses (tutoring, salons, gyms, etc.).

## Structure

- `frontend/` — Next.js + TypeScript + Tailwind
- `backend/` — Node/Express API + TypeScript

## Local development

```bash
docker compose up -d              # Postgres + Redis
npm install                       # also generates the Prisma client
npm run prisma:migrate --workspace backend
npm run db:seed --workspace backend   # optional: sample business/services
npm run dev:backend                # API on :4000
npm run dev:frontend                # Web on :3000
```

Copy `backend/.env.example` to `backend/.env` and adjust as needed.

Note: Postgres is mapped to host port **5433** (not the default 5432) to avoid clashing with
a locally installed Postgres service, if you have one.
