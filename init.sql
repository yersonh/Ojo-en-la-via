CREATE TABLE IF NOT EXISTS persona (
    id_persona SERIAL PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS estado_usuario (
    id_estado SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS rol (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    id_persona INT NOT NULL,
    id_rol INT NOT NULL,
    id_estado INT NOT NULL DEFAULT 1,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    CONSTRAINT fk_usuario_persona FOREIGN KEY (id_persona) REFERENCES persona (id_persona) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES rol (id_rol) ON DELETE RESTRICT,
    CONSTRAINT fk_usuario_estado FOREIGN KEY (id_estado) REFERENCES estado_usuario (id_estado) ON DELETE RESTRICT
);

-- 🆕 TABLA REMEMBER_TOKENS - EN ORDEN CORRECTO
CREATE TABLE IF NOT EXISTS remember_tokens (
    id_token SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    expiracion TIMESTAMP NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recovery_tokens (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    expiracion TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recovery_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- Datos iniciales
INSERT INTO estado_usuario (nombre) VALUES 
('Activo'), 
('Inactivo')
ON CONFLICT DO NOTHING;

INSERT INTO rol (nombre, descripcion) VALUES 
('Admin', 'Administrador general'), 
('Usuario', 'Usuario estándar')
ON CONFLICT DO NOTHING;

INSERT INTO persona (nombres, apellidos, telefono) VALUES 
('Yerson', 'Solano Alfonso', '3142452456'),
('Lauren', 'Oviedo Garces', '3117962475'),
('Isabella', 'Hernadez Parrado', '3154567890')
ON CONFLICT DO NOTHING;

-- INSERTS con hashes bcrypt
INSERT INTO usuario (id_persona, id_rol, id_estado, correo, contrasena) VALUES 
(1, 1, 1, 'solanoalfonsoy@gmail.com', '$2b$12$TuijOg5BDHfcJ42GzyinNuaqLaiRPtYaLEGLNiHl5gmyNu4QWtjSO'),
(2, 1, 1, 'lauren.oviedo68@gmail.com', '$2b$12$2fHBgK/57vFJdcF7CSnWqO8DYaESHf85d9ZRHyt0vNRswxeedMw7W'), 
(3, 1, 1, 'isamoradahernandezp@gmail.com', '$2b$12$sc2lFhNFEdiU1GibsSzpOe3C3.nh6cYKj0otL57fBI3z6UBcKP4WC')
ON CONFLICT (correo) DO NOTHING;

-- Resto de tablas
CREATE TABLE IF NOT EXISTS tipo_incidente (
    id_tipo_incidente SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

INSERT INTO tipo_incidente (nombre, descripcion) VALUES
('Accidente de tránsito', 'Colisión o siniestro vial'),
('Hueco en la vía', 'Daño en la calzada'),
('Semáforo dañado', 'Falla en la señal de tránsito'),
('Inundación', 'Vía obstruida por acumulación de agua')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS reporte (
    id_reporte SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_tipo_incidente INT NOT NULL,
    descripcion TEXT NOT NULL,
    latitud DECIMAL(10,8) NOT NULL,
    longitud DECIMAL(11,8) NOT NULL,
    fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'Pendiente',
    CONSTRAINT fk_reporte_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_reporte_tipo FOREIGN KEY (id_tipo_incidente) REFERENCES tipo_incidente (id_tipo_incidente) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS imagen_reporte (
    id_imagen SERIAL PRIMARY KEY,
    id_reporte INT NOT NULL,
    url_imagen TEXT NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_imagen_reporte FOREIGN KEY (id_reporte) REFERENCES reporte (id_reporte) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comentario_reporte (
    id_comentario SERIAL PRIMARY KEY,
    id_reporte INT NOT NULL,
    id_usuario INT NOT NULL,
    comentario TEXT NOT NULL,
    fecha_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comentario_reporte FOREIGN KEY (id_reporte) REFERENCES reporte (id_reporte) ON DELETE CASCADE,
    CONSTRAINT fk_comentario_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historial_estado (
    id_historial SERIAL PRIMARY KEY,
    id_reporte INT NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT, 
    CONSTRAINT fk_historial_reporte FOREIGN KEY (id_reporte) REFERENCES reporte (id_reporte) ON DELETE CASCADE,
    CONSTRAINT fk_historial_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS like_reporte (
    id_like SERIAL PRIMARY KEY,
    id_reporte INT NOT NULL,
    id_usuario INT NOT NULL,
    fecha_like TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_like_reporte FOREIGN KEY (id_reporte) REFERENCES reporte (id_reporte) ON DELETE CASCADE,
    CONSTRAINT fk_like_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT uq_like UNIQUE (id_reporte, id_usuario)
);

CREATE TABLE IF NOT EXISTS notificacion (
    id_notificacion SERIAL PRIMARY KEY,
    id_usuario_destino INT NOT NULL,
    id_usuario_origen INT,
    id_reporte INT,
    tipo VARCHAR(50) NOT NULL,
    mensaje TEXT,
    leida BOOLEAN DEFAULT FALSE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notificacion_destino FOREIGN KEY (id_usuario_destino) REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_notificacion_origen FOREIGN KEY (id_usuario_origen) REFERENCES usuario (id_usuario) ON DELETE SET NULL,
    CONSTRAINT fk_notificacion_reporte FOREIGN KEY (id_reporte) REFERENCES reporte (id_reporte) ON DELETE CASCADE
);

-- 🆕 ÍNDICES AL FINAL
CREATE INDEX IF NOT EXISTS idx_remember_token ON remember_tokens(token);
CREATE INDEX IF NOT EXISTS idx_remember_expiracion ON remember_tokens(expiracion);
CREATE INDEX IF NOT EXISTS idx_remember_usuario ON remember_tokens(id_usuario);

-- Datos de prueba (opcional)
INSERT INTO reporte (id_usuario, id_tipo_incidente, descripcion, latitud, longitud) VALUES 
(1, 1, 'Hueco grande frente al parque principal', 4.15123456, -73.63567890)
ON CONFLICT DO NOTHING;

INSERT INTO imagen_reporte (id_reporte, url_imagen) VALUES 
(1, 'https://miapp.com/uploads/hueco_parque.jpg')
ON CONFLICT DO NOTHING;

INSERT INTO comentario_reporte (id_reporte, id_usuario, comentario) VALUES 
(1, 2, 'Yo también lo vi, sigue igual esta semana.')
ON CONFLICT DO NOTHING;