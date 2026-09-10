# FindIt Surat

FindIt Surat helps people discover textile products and contact Surat shops for an offline visit. It is not an e-commerce application: there is no cart, payment, delivery, or checkout.

## Areas

- `apps/web/src/seller` - active seller MVP
- `apps/web/src/users` - reserved customer experience
- `apps/web/src/admin` - reserved admin experience

## Run with Docker and Neon

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and start it.
2. Create `apps/api/.env` from `apps/api/.env.example` and set a strong `JWT_SECRET`. Docker provides MySQL and Qdrant; no Neon or PostgreSQL connection string is required.
   Set `ADMIN_MOBILE` and `ADMIN_PASSWORD` for the basic admin console at `/admin`.
3. Build containers: `docker compose build`.
4. Apply database migrations once: `docker compose run --rm api pnpm migrate`.
5. Start everything: `docker compose up`.
6. Open `http://localhost:5173`; the API health endpoint is `http://localhost:5000/health`.

MySQL, Redis, and Qdrant run in Docker. The free CLIP embedding model downloads on the first image index/search request, so the first search takes longer.

## Run locally without Docker

1. Copy `apps/api/.env.example` to `apps/api/.env` and fill the secrets. For Neon, put the complete Neon connection string in `DATABASE_URL` and retain `sslmode=require`.
2. Start PostgreSQL with `docker compose up -d postgres`.
3. Install packages with `npm install`.
4. Run SQL migrations in `apps/api/database/migrations` in filename order.
5. Start the API with `npm run dev:api` and the web app with `npm run dev:web`.

The seller MVP uses PostgreSQL through `pg` and parameterized raw SQL only. No ORM is used.
