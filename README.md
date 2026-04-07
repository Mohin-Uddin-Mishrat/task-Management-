# User Task Management Backend

## Docker quick start

Run the full local stack with:

```bash
docker compose up --build
```

That command starts:

- `api`: the NestJS backend on `http://localhost:5000`
- `db`: PostgreSQL on `localhost:5434`

During container startup the API runs Prisma migrations automatically, then starts the server.

### Default Docker credentials

The compose file provides local-safe defaults so it does not depend on the Neon `DATABASE_URL` in `.env`.

- Database: `postgres://postgres:postgres@localhost:5434/task_db`
- Seed admin email: `admin@example.com`
- Seed admin password: `123456`

You can override any of those values by exporting environment variables before running compose, for example:

```bash
POSTGRES_DB=myapp PORT=3000 ADMIN_PASSWORD=secret docker compose up --build
```

Optional tooling:

```bash
docker compose --profile tools up --build
```

That also starts pgAdmin on `http://localhost:8123`.

## Local non-Docker run

```bash
npm install
npm run start:dev
```

## Useful commands

```bash
docker compose down
docker compose down -v
docker compose logs -f api
```
