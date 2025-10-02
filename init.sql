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
(2, 1, 1, 'laurenoviedo@gmail.com', '$2b$12$2fHBgK/57vFJdcF7CSnWqO8DYaESHf85d9ZRHyt0vNRswxeedMw7W'), 
(3, 1, 1, 'isabellahernadez@gmail.com', '$2b$12$sc2lFhNFEdiU1GibsSzpOe3C3.nh6cYKj0otL57fBI3z6UBcKP4WC');

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
