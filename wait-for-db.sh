#!/bin/sh

# Wait for MySQL to be ready
echo "Waiting for database..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 1
done
echo "Database is up, starting app..."

# Start the app
exec "$@"
