---
phase: 1
status: complete
date: 2025-09-01
branch: feat/phase-1-backend-mvp
commit: 9fa695f
next_phase: 2
artifacts:
  backend:
    migrations:
      - apps/people/migrations/0002_alter_phone_e164.py
      - apps/trips/migrations/0002_alter_reservation_options_remove_reservation_client_and_more.py
    endpoints:
      - GET /api/trips/
      - POST /api/trips/{id}/reserve
      - PATCH /api/reservations/{id}
      - PATCH /api/assignments/{id}
      - GET /api/export/trips/{id}/manifest.csv
  frontend:
    routes:
      - /trips
      - /trips/:tripId
      - /clients
      - /clients/:clientId
links:
  demo_trip: "http://localhost:5173/trips/<uuid>?seat=12"
  manifest_example: "http://localhost:8000/api/export/trips/<uuid>/manifest.csv"
---
# Phase 1 Handoff — Backend foundation

## 1) What shipped
- Clients CRUD with relaxed phone numbers and realtime update signals.
- Trip reservations with seat assignments, CSV manifest export, and hypermedia links.
- Tailwind design tokens and demo seed data.

## 2) How to run
```bash
docker compose up -d --build
docker compose exec web python manage.py migrate
# optional: seed data
docker compose exec web python manage.py loaddata seeds/phase1.json
```

3) API surface (current)
3.1 Endpoints

GET /api/trips/?date_from=...&date_to=...&destination=...

POST /api/trips/{id}/reserve

PATCH /api/reservations/{id}

PATCH /api/assignments/{id}

GET /api/clients/?search=...

GET /api/export/trips/{id}/manifest.csv

3.2 Example requests/responses
POST /api/trips/3d2c.../reserve
Content-Type: application/json

{"quantity": 3, "contact_client_id": "5a1b...", "notes": "Group hold"}

HTTP/1.1 201 Created
{"reservation_id":"9f8e...","assigned_seats":[12,13,14]}
