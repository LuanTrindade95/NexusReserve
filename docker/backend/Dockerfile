FROM php:8.3-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libzip-dev $PHPIZE_DEPS \
    && docker-php-ext-install pdo_mysql pcntl sockets zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get purge -y --auto-remove $PHPIZE_DEPS \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/backend

COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-progress --no-scripts

COPY backend ./
COPY docker/backend/entrypoint.sh /usr/local/bin/nexus-backend-entrypoint

RUN chmod +x /usr/local/bin/nexus-backend-entrypoint \
    && composer install --no-interaction --prefer-dist --no-progress

EXPOSE 8000

ENTRYPOINT ["nexus-backend-entrypoint"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
