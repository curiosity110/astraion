---
phase: 2
status: complete
date: 2025-09-01
branch: feat/phase-2-frontend-ui
commit: b1eada0
next_phase: 3
artifacts:
  backend:
    migrations: []
    endpoints:
      - GET /api/trips/
      - POST /api/trips/{id}/reserve
      - PATCH /api/reservations/{id}
      - PATCH /api/assignments/{id}
      - GET /api/clients/?search=
      - GET /api/export/trips/{id}/manifest.csv
  frontend:
    routes:
      - /trips
      - /trips/:tripId
      - /clients
      - /clients/:clientId
links:
  clients_page: "http://localhost:5173/clients"
  trips_page: "http://localhost:5173/trips"
---
# Phase 2 Handoff — Frontend clients & trips UI

## 1) What shipped
- React frontend with Tailwind tokens.
- Clients list & profile pages with search and hypermedia links.
- Trips list and trip detail with seat map, reservation create/cancel, and WebSocket updates.

## 2) How to run
```bash
docker compose up -d --build
docker compose exec web python manage.py migrate
# optional seed data
docker compose exec web python manage.py loaddata seeds/phase1.json
npm --prefix frontend install
npm --prefix frontend run dev
```

3) API surface (current)
3.1 Endpoints

GET /api/trips/?date_from=...&date_to=...&destination=...

POST /api/trips/{id}/reserve

PATCH /api/reservations/{id}

PATCH /api/assignments/{id}

GET /api/clients/?search=...

GET /api/export/trips/{id}/manifest.csv

## Screenshots

![Clients list](../screenshots/clients-list.png)
![Client profile](../screenshots/client-profile.png)
![Trips list](../screenshots/trips-list.png)
![Trip detail](../screenshots/trip-detail.png)
