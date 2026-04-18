#!/bin/sh
set -e

echo "==> Optimisation config..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Migrations..."
php artisan migrate --force

echo "==> Démarrage serveur sur port ${PORT:-8080}..."
exec php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
