# UI Polish

- Date: 2025-09-01
- Branch: feat/ui-polish-only
- Commit: TODO

## Changes

- Added global app shell with persistent navbar and add-client modal.
- Introduced simple UI primitives (Badge, Button, Card, Tabs, Table, Input).
- Updated Layout to use new AppShell.

## Run

```bash
# backend
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

# frontend
cd frontend
npm i
npm run dev
```

## Screenshots

- _Add markdown image links here_
