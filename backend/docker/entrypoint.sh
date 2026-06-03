#!/bin/sh

set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting Django development server on 0.0.0.0:9000..."
python manage.py runserver 0.0.0.0:9000