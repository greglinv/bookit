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

## API overview

| Method & path | Access | Purpose |
|---|---|---|
| `POST /auth/signup`, `/auth/login`, `/auth/logout`; `GET /auth/me` | public / session | Cookie-based JWT auth |
| `GET /businesses`, `GET /businesses/:id` | public | Browse businesses, services, weekly hours |
| `GET /businesses/:id/services/:serviceId/slots?date=YYYY-MM-DD` | public | Open 15-minute-grid start times for a day |
| `POST /bookings` `{ serviceId, startTime }` | logged in | Book a slot (server computes `endTime`) |
| `GET /bookings` | logged in | Your own bookings |
| `POST /bookings/:id/cancel` | customer or business owner | Customers: >= `CANCELLATION_WINDOW_HOURS` ahead; owners: any time |
| `GET /businesses/:id/bookings?from&to` | `OWNER` of that business | All bookings for the business |

Double-booking is prevented by a `SELECT ... FOR UPDATE` lock on the business row inside the
booking transaction: a business is a single resource, so no two active bookings may overlap,
regardless of service. Availability is interpreted in the business's own timezone (`Business.timezone`).
