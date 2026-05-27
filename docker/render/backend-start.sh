#!/usr/bin/env sh
set -eu

if [ -n "${AIVEN_CA_PEM:-}" ]; then
    printf '%s\n' "$AIVEN_CA_PEM" > /tmp/aiven-ca.pem
    export MYSQL_ATTR_SSL_CA=/tmp/aiven-ca.pem
fi

php artisan config:cache --no-interaction
php artisan route:cache --no-interaction
php artisan view:cache --no-interaction

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    php artisan migrate --force --no-interaction
fi

if [ "${RUN_SEEDERS:-false}" = "true" ]; then
    php artisan db:seed --force --no-interaction
fi

if [ "${1:-}" = "serve" ]; then
    exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
fi

exec "$@"
