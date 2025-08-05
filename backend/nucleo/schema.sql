-- Database Schema for Transporte Lanus
-- Based on the SQL queries in the credential.php file

-- Tokens de acceso para credenciales
CREATE TABLE IF NOT EXISTS tokens_acceso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    habilitacion_id INT NOT NULL,
    fecha_expiracion DATETIME NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (token)
);

-- Tabla principal de habilitaciones
CREATE TABLE IF NOT EXISTS habilitaciones_generales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nro_licencia VARCHAR(50) NOT NULL,
    resolucion VARCHAR(100),
    vigencia_inicio DATE,
    vigencia_fin DATE,
    estado ENUM('HABILITADO', 'SUSPENDIDO', 'VENCIDO', 'PENDIENTE') NOT NULL DEFAULT 'PENDIENTE',
    tipo_transporte ENUM('ESCOLAR', 'ESPECIAL', 'OTRO') NOT NULL
);

-- Tabla de personas (titulares, conductores, celadores)
CREATE TABLE IF NOT EXISTS personas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20),
    cuit VARCHAR(20),
    foto_url VARCHAR(255),
    fecha_nacimiento DATE
);

-- Relación entre habilitaciones y personas
CREATE TABLE IF NOT EXISTS habilitaciones_personas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    habilitacion_id INT NOT NULL,
    persona_id INT NOT NULL,
    rol ENUM('TITULAR', 'CONDUCTOR', 'CELADOR') NOT NULL,
    licencia_categoria VARCHAR(10),
    FOREIGN KEY (habilitacion_id) REFERENCES habilitaciones_generales(id),
    FOREIGN KEY (persona_id) REFERENCES personas(id)
);

-- Tabla de establecimientos
CREATE TABLE IF NOT EXISTS establecimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    domicilio VARCHAR(200),
    localidad VARCHAR(100),
    telefono VARCHAR(50)
);

-- Relación entre habilitaciones y establecimientos
CREATE TABLE IF NOT EXISTS habilitaciones_establecimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    habilitacion_id INT NOT NULL,
    establecimiento_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'establecimiento',
    FOREIGN KEY (habilitacion_id) REFERENCES habilitaciones_generales(id),
    FOREIGN KEY (establecimiento_id) REFERENCES establecimientos(id)
);

-- Tabla de vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    ano INT,
    motor VARCHAR(100),
    chasis VARCHAR(100),
    asientos INT,
    dominio VARCHAR(10),
    Aseguradora VARCHAR(100),
    poliza VARCHAR(100),
    Vencimiento_VTV DATE,
    Vencimiento_Poliza DATE
);

-- Relación entre habilitaciones y vehículos
CREATE TABLE IF NOT EXISTS habilitaciones_vehiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    habilitacion_id INT NOT NULL,
    vehiculo_id INT NOT NULL,
    FOREIGN KEY (habilitacion_id) REFERENCES habilitaciones_generales(id),
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id)
);

-- Datos de ejemplo para pruebas
INSERT INTO habilitaciones_generales (nro_licencia, resolucion, vigencia_inicio, vigencia_fin, estado, tipo_transporte)
VALUES 
('HT-2023-001', 'RES-2023/123', '2023-01-01', '2026-01-01', 'HABILITADO', 'ESCOLAR'),
('HT-2023-002', 'RES-2023/124', '2023-02-01', '2026-02-01', 'HABILITADO', 'ESPECIAL');

INSERT INTO personas (nombre, apellido, dni, cuit, foto_url)
VALUES
('Juan', 'Pérez', '20123456', '20201234567', 'https://randomuser.me/api/portraits/men/1.jpg'),
('María', 'González', '25789012', '27257890123', 'https://randomuser.me/api/portraits/women/1.jpg'),
('Carlos', 'Rodríguez', '30456789', '20304567890', 'https://randomuser.me/api/portraits/men/2.jpg');

INSERT INTO habilitaciones_personas (habilitacion_id, persona_id, rol, licencia_categoria)
VALUES
(1, 1, 'TITULAR', NULL),
(1, 2, 'CONDUCTOR', 'D1'),
(1, 3, 'CELADOR', NULL);

INSERT INTO vehiculos (marca, modelo, ano, motor, chasis, asientos, dominio, Aseguradora, poliza, Vencimiento_VTV, Vencimiento_Poliza)
VALUES
('Mercedes Benz', 'Sprinter 515', 2020, 'MB123456789', 'MECS123456789', 19, 'AB123CD', 'Seguros La Estrella', 'POL-123456', '2023-12-31', '2023-12-31');

INSERT INTO habilitaciones_vehiculos (habilitacion_id, vehiculo_id)
VALUES
(1, 1);

INSERT INTO establecimientos (nombre, domicilio, localidad)
VALUES
('Escuela Primaria N°1', 'Av. Principal 123', 'Lanús');

INSERT INTO habilitaciones_establecimientos (habilitacion_id, establecimiento_id, tipo)
VALUES
(1, 1, 'establecimiento');

INSERT INTO tokens_acceso (token, habilitacion_id, fecha_expiracion)
VALUES
('50df3dbf6a8bde58eff71e695c24266a80551abaafef4dceebd8d3b3af728dc2', 1, '2026-01-01 00:00:00');
