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

# CONFIGURACIÓN ESPECÍFICA PARA RAILWAY
EXPOSE 8080
ENV PORT=8080

# Configurar Apache para usar el puerto de Railway
RUN sed -i 's/80/${PORT}/g' /etc/apache2/ports.conf
RUN sed -i 's/80/${PORT}/g' /etc/apache2/sites-available/000-default.conf

CMD ["apache2-foreground"]