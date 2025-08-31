#!/bin/sh
set -e

echo "Waiting for database at $POSTGRES_HOST:$POSTGRES_PORT..."

# wait until Postgres is ready
until nc -z "$POSTGRES_HOST" "$POSTGRES_PORT"; do
  sleep 1
done

echo "Database is up!"

# Apply migrations
echo "Applying Django migrations..."
python manage.py migrate --noinput

# Collect static files (optional for prod)
# python manage.py collectstatic --noinput

# Start server
echo "Starting server..."
exec "$@"
