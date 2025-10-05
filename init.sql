CREATE TABLE persona (
    id_persona SERIAL PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20)
);

CREATE TABLE estado_usuario (
    id_estado SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE rol (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

CREATE TABLE usuario (
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

-- Inserts iniciales
INSERT INTO estado_usuario (nombre) VALUES ('Activo'), ('Inactivo');
INSERT INTO rol (nombre, descripcion) VALUES ('Admin', 'Administrador general'), ('Usuario', 'Usuario estándar');

INSERT INTO persona (nombres, apellidos, telefono) VALUES 
('Yerson', 'Solano Alfonso', '3142452456'),
('Lauren', 'Oviedo Garces', '3117962475'),
('Isabella', 'Hernadez Parrado', '3154567890');

-- INSERTS con hashes bcrypt reales para la contraseña "12345678"
INSERT INTO usuario (id_persona, id_rol, id_estado, correo, contrasena) VALUES 
(1, 1, 1, 'solanoalfonsoy@gmail.com', '$2b$12$TuijOg5BDHfcJ42GzyinNuaqLaiRPtYaLEGLNiHl5gmyNu4QWtjSO'),
(2, 1, 1, 'lauren.oviedo68@gmail.com', '$2b$12$2fHBgK/57vFJdcF7CSnWqO8DYaESHf85d9ZRHyt0vNRswxeedMw7W'), 
(3, 1, 1, 'isamoradahernandezp@gmail.com', '$2b$12$sc2lFhNFEdiU1GibsSzpOe3C3.nh6cYKj0otL57fBI3z6UBcKP4WC');

-- Opcional: usuario adicional admin (con contraseña 'admin123')
INSERT INTO persona (nombres, apellidos, telefono) VALUES ('Super', 'Admin', '3000000000');
INSERT INTO usuario (id_persona, id_rol, id_estado, correo, contrasena) VALUES 
(4, 1, 1, 'admin@example.com', '$2b$12$4j5TRCPTBxt3NUpzkmb1teaALHw9w6XAWXG.KIVdzlAYbVu.qyvJy');

CREATE TABLE recovery_tokens (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    expiracion TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recovery_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);
CREATE TABLE tipo_incidente (
    id_tipo_incidente SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Ejemplos iniciales
INSERT INTO tipo_incidente (nombre, descripcion) VALUES
('Accidente de tránsito', 'Colisión o siniestro vial'),
('Hueco en la vía', 'Daño en la calzada'),
('Semáforo dañado', 'Falla en la señal de tránsito'),
('Inundación', 'Vía obstruida por acumulación de agua');

CREATE TABLE reporte (
    id_reporte SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_tipo_incidente INT NOT NULL,
    descripcion TEXT NOT NULL,
    latitud DECIMAL(10,8) NOT NULL,
    longitud DECIMAL(11,8) NOT NULL,
    fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'Pendiente', -- Pendiente, Verificado, Resuelto
    CONSTRAINT fk_reporte_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_reporte_tipo FOREIGN KEY (id_tipo_incidente) REFERENCES tipo_incidente (id_tipo_incidente) ON DELETE RESTRICT
);

CREATE TABLE imagen_reporte (
    id_imagen SERIAL PRIMARY KEY,
    id_reporte INT NOT NULL,
    url_imagen TEXT NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_imagen_reporte FOREIGN KEY (id_reporte) REFERENCES reporte (id_reporte) ON DELETE CASCADE
);

CREATE TABLE comentario_reporte (
    id_comentario SERIAL PRIMARY KEY,
    id_reporte INT NOT NULL,
    id_usuario INT NOT NULL,
    comentario TEXT NOT NULL,
    fecha_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comentario_reporte FOREIGN KEY (id_reporte) REFERENCES reporte (id_reporte) ON DELETE CASCADE,
    CONSTRAINT fk_comentario_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE
);

CREATE TABLE historial_estado (
    id_historial SERIAL PRIMARY KEY,
    id_reporte INT NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT, -- quién realizó el cambio
    CONSTRAINT fk_historial_reporte FOREIGN KEY (id_reporte) REFERENCES reporte (id_reporte) ON DELETE CASCADE,
    CONSTRAINT fk_historial_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE SET NULL
);
-- Insertar un tipo de incidente
INSERT INTO tipo_incidente (nombre, descripcion)
VALUES ('Hueco en la vía', 'Bache o daño en la calzada');

-- Insertar un reporte de prueba
INSERT INTO reporte (id_usuario, id_tipo_incidente, descripcion, latitud, longitud)
VALUES (1, 1, 'Hueco grande frente al parque principal', 4.15123456, -73.63567890);

-- Insertar una imagen relacionada
INSERT INTO imagen_reporte (id_reporte, url_imagen)
VALUES (1, 'https://miapp.com/uploads/hueco_parque.jpg');

-- Insertar un comentario
INSERT INTO comentario_reporte (id_reporte, id_usuario, comentario)
VALUES (1, 2, 'Yo también lo vi, sigue igual esta semana.');

