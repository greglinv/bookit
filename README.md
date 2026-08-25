# BookIt — Booking & Scheduling Platform

A full-stack booking and scheduling platform for small service businesses (tutoring, salons, gyms, etc.).

## Structure

- `frontend/` — Next.js + TypeScript + Tailwind
- `backend/` — Node/Express API + TypeScript

## Local development

```bash
docker compose up -d      # Postgres + Redis
npm install
npm run dev:backend       # API on :4000
npm run dev:frontend      # Web on :3000
```

Copy `backend/.env.example` to `backend/.env` and adjust as needed.
