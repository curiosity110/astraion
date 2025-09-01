# Astraion — Trips & Clients Manager

## Quickstart (Local Dev)
```bash
git clone https://github.com/<you>/astraion.git
cd astraion
cp .env.example .env
docker compose up -d --build
docker compose exec web python manage.py migrate
docker compose exec web python manage.py loaddata seeds/phase1.json
npm install --prefix frontend
npm run dev --prefix frontend
```

Backend → http://localhost:8000/api/

Frontend → http://localhost:5173/

## Features
- Clients, Trips, Reservations, Reports…

## Testing
```bash
docker compose exec web pytest
```

## Deployment
- Environment vars (POSTGRES_*, ALLOWED_HOSTS, etc.).
- Building with Docker.
- How to run migrations + seeds.
