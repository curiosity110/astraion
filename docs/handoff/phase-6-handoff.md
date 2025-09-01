---
phase: 6
status: complete
date: 2025-09-08
branch: feat/phase-6-crm-layer
commit: 5f15510
next_phase: 7
artifacts:
  backend:
    migrations:
      - 0003_client_tags_activityevent_clientnote
    endpoints:
      - PATCH /api/clients/{id}/tags
      - POST /api/clients/{id}/notes
      - GET /api/clients/{id}/notes
      - GET /api/activity/feed
  frontend:
    routes:
      - /clients/:id (tags, notes)
      - /activity
links:
  activity_page: "http://localhost:5173/activity"
---
# Phase 6 Handoff — CRM Layer

## 1) What shipped
- Client tags with filtering and inline edit.
- Client notes with realtime updates.
- Activity feed for tag and note events.

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
- PATCH /api/clients/{id}/tags
- POST /api/clients/{id}/notes
- GET /api/clients/{id}/notes
- GET /api/activity/feed

## Screenshots
![Client tags wireframe](../screenshots/client-tags.png)
![Activity feed wireframe](../screenshots/activity-feed.png)
