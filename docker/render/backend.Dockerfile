FROM composer:2 AS vendor

WORKDIR /app

COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-progress --no-scripts --optimize-autoloader --ignore-platform-req=ext-pcntl

COPY backend ./
RUN composer dump-autoload --no-dev --optimize

FROM php:8.3-cli-alpine AS runtime

RUN apk add --no-cache icu-libs libzip mysql-client \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS icu-dev libzip-dev linux-headers \
    && docker-php-ext-install intl pdo_mysql pcntl sockets zip opcache \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

WORKDIR /var/www/backend

COPY --from=vendor /app ./
COPY docker/prod/php.ini /usr/local/etc/php/conf.d/nexusreserve.ini
COPY docker/render/backend-start.sh /usr/local/bin/nexus-render-start

RUN chmod +x /usr/local/bin/nexus-render-start \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

EXPOSE 10000

ENTRYPOINT ["nexus-render-start"]
CMD ["serve"]
