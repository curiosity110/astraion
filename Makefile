.PHONY: setup migrate seed test

setup:
	docker compose up -d --build

migrate:
	docker compose exec web python manage.py migrate

seed:
	docker compose exec web python manage.py loaddata seeds/phase1.json

test:
	docker compose exec web pytest
