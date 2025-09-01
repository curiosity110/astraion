---
phase: 11
status: complete
date: 2025-09-01
branch: feat/phase-11-excel-killer
commit: f2acea2
endpoints:
  - /api/clients/import/
  - /api/clients/bulk/
  - /api/trips/import/
  - /api/trips/bulk/
  - /api/reservations/bulk/
routes:
  - /clients
  - /trips
  - /trips/:id
run:
  - docker compose up -d --build
  - docker compose exec web python manage.py migrate
  - docker compose exec web python manage.py loaddata seeds/phase1.json
  - npm --prefix frontend install
  - npm --prefix frontend run dev
---
# Phase 11 Handoff — Excel-Killer UX

## Summary
- Bulk actions for clients, trips, and reservations.
- CSV import/export for clients and trips.
- Drag-and-drop seat management with real-time updates.

## Screenshots
![Bulk seat assignment wireframe](../screenshots/bulk-seats.png)
