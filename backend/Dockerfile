FROM php:8.2-cli-bullseye

# Évite les prompts interactifs
ENV DEBIAN_FRONTEND=noninteractive

# Extensions système + PHP en une seule couche
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    curl \
    git \
    unzip \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libicu-dev \
    libonig-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        mbstring \
        gd \
        exif \
        pcntl \
        bcmath \
        intl \
        opcache \
        zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Dépendances Composer (layer cacheable séparé)
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Code source
COPY . .

# Permissions storage
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Discover packages (sans scripts qui nécessitent .env)
RUN composer dump-autoload --optimize

# Script de démarrage : migrations + cache + serveur
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080

CMD ["/start.sh"]
