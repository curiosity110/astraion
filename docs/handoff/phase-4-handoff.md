---
phase: 4
status: complete
date: 2025-09-08
branch: feat/phase-4-client-histories
commit: efd79cc
next_phase: 5
artifacts:
  backend:
    migrations: []
    endpoints:
      - GET /api/clients/{id}/history
      - GET /api/trips/{id}/report
  frontend:
    routes:
      - /clients/:clientId (history tab)
      - /trips/:tripId (report tab)
links:
  client_page: "http://localhost:5173/clients/{clientId}"
  trip_page: "http://localhost:5173/trips/{tripId}"
---
# Phase 4 Handoff — Client Histories & Trip Reports

## 1) What shipped
- Client history API and UI tab showing reservations with seat numbers and statuses.
- Trip report API and UI with manifest preview and stats (total, booked, available, cancellations).
- JSON export for trip reports plus existing CSV manifest export.
- Realtime websocket updates for client history and trip report stats.

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
- GET /api/clients/{id}/history
- GET /api/trips/{id}/report
- GET /api/export/trips/{id}/manifest.csv
- POST /api/trips/{id}/reserve
- PATCH /api/reservations/{id}
- PATCH /api/assignments/{id}
- GET /api/clients/?search=

## Screenshots
![Client history wireframe](../screenshots/client-history.png)
![Trip report wireframe](../screenshots/trip-report.png)
