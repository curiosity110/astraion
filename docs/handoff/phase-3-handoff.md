---
phase: 3
status: complete
date: 2025-09-08
branch: feat/phase-3-reservations-ux
commit: 0a125c2
next_phase: 4
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
# Phase 3 Handoff — Reservations & Seat Management UX

## 1) What shipped
- Interactive seat map with inline passenger editing and seat swapping.
- Reservation create/update flows with quantity, status and contact management.
- Overbooking feedback with optional manager override header.
- Realtime updates for seat and reservation changes.

## 2) How to run
```bash
docker compose up -d --build
docker compose exec web python manage.py migrate
docker compose exec web python manage.py loaddata seeds/phase1.json
npm --prefix frontend install
npm --prefix frontend run dev
```

## 3) API surface (current)
### Endpoints
- GET /api/trips/?date_from=...&date_to=...&destination=...
- POST /api/trips/{id}/reserve
- PATCH /api/reservations/{id}
- PATCH /api/assignments/{id}
- GET /api/clients/?search=...
- GET /api/export/trips/{id}/manifest.csv

## Screenshots
![Reservation flow](../screenshots/reservation-flow.png)
![Seat editing](../screenshots/seat-edit.png)
