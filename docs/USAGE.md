# Astraion — Trips & Clients Manager

This project runs both locally and in Docker. Seeds, websockets, and tests are wired to work end‑to‑end.

## Local Development

Backend and frontend run separately on localhost.

```bash
# Local dev
python -m venv venv && source venv/bin/activate
cd backend
pip install -r requirements.txt
cd ../frontend && npm install && cd ..
cd backend
python manage.py migrate
python manage.py loaddata seeds/phase1.json
python manage.py runserver 0.0.0.0:8000
# In another terminal
npm run dev --prefix frontend
```

- Backend API: http://localhost:8000/api/trips/
- Frontend UI: http://localhost:5173/
- WebSocket: ws://localhost:8000/ws/dashboard/

## Docker Workflow

One command builds and starts Postgres, Redis, Django (ASGI/Channels), and Vite dev server.

```bash
docker compose up -d --build

# Run migrations + load seeds in the web container
docker compose exec web python manage.py migrate
docker compose exec web python manage.py loaddata seeds/phase1.json
```

- backend: http://localhost:8000
- frontend: http://localhost:5173
- db: postgres://astraion:astraion@db:5432/astraion

## QA & Tooling

Backend (inside container or local venv):

```bash
# Run tests
pytest

# Lint & format
ruff check backend
black backend
# Optional if installed
flake8 backend
```

Frontend:

```bash
npm run lint --prefix frontend
npx prettier --check . --prefix frontend
```

## Notes

- WebSockets: asgi routes ws://localhost:8000/ws/... for dashboard, trips, and clients. The frontend auto‑reconnects.
- Seeds: `backend/seeds/phase1.json` includes required `created_at`/`updated_at` fields so loaddata runs cleanly.
- Environment: `backend/.env.dev` is for local dev; `backend/.env` is used by Docker.
