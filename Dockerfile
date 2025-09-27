FROM php:8.2-apache

# Instalar extensiones para PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql pgsql

# Habilitar mod_rewrite (si lo usas en tu app)
RUN a2enmod rewrite

# Copiar el proyecto al contenedor
COPY . /var/www/html/

# Dar permisos correctos
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
