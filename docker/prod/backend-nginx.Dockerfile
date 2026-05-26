FROM nginx:1.27-alpine

COPY backend/public /var/www/backend/public
COPY docker/prod/nginx-backend.conf /etc/nginx/conf.d/default.conf
