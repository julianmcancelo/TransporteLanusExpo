# 🚀 GUÍA DE DEPLOYMENT
## Sistema de Gestión de Habilitaciones de Transporte - Lanús

---

## 📋 ÍNDICE

1. [Prerrequisitos](#prerrequisitos)
2. [Configuración del Servidor](#configuración-del-servidor)
3. [Deployment del Backend](#deployment-del-backend)
4. [Build de la Aplicación Mobile](#build-de-la-aplicación-mobile)
5. [Configuración de Base de Datos](#configuración-de-base-de-datos)
6. [Variables de Entorno](#variables-de-entorno)
7. [SSL y Seguridad](#ssl-y-seguridad)
8. [Monitoreo y Logs](#monitoreo-y-logs)
9. [Backup y Recuperación](#backup-y-recuperación)
10. [Troubleshooting](#troubleshooting)

---

## 🔧 PRERREQUISITOS

### Servidor Web
- **Sistema Operativo**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **Servidor Web**: Apache 2.4+ o Nginx 1.18+
- **PHP**: 8.1 o superior
- **MySQL**: 8.0 o superior
- **SSL Certificate**: Recomendado para producción

### Herramientas de Desarrollo
- **Node.js**: 18.x o superior
- **npm**: 9.x o superior
- **Expo CLI**: Última versión
- **Git**: Para control de versiones

### Servicios Externos
- **EAS Build**: Para builds de producción
- **Servicio de Email**: SMTP configurado
- **Storage**: Para imágenes y documentos

---

## 🖥️ CONFIGURACIÓN DEL SERVIDOR

### Apache Configuration
```apache
# /etc/apache2/sites-available/transporte-lanus.conf
<VirtualHost *:80>
    ServerName api.transporte-lanus.gov.ar
    DocumentRoot /var/www/transporte-lanus/backend
    
    <Directory /var/www/transporte-lanus/backend>
        AllowOverride All
        Require all granted
    </Directory>
    
    # Redirect to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName api.transporte-lanus.gov.ar
    DocumentRoot /var/www/transporte-lanus/backend
    
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    
    <Directory /var/www/transporte-lanus/backend>
        AllowOverride All
        Require all granted
        
        # CORS Headers
        Header always set Access-Control-Allow-Origin "*"
        Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
        Header always set Access-Control-Max-Age "3600"
    </Directory>
    
    # PHP Configuration
    php_value upload_max_filesize 50M
    php_value post_max_size 50M
    php_value max_execution_time 300
    php_value memory_limit 256M
</VirtualHost>
```

### Nginx Configuration
```nginx
# /etc/nginx/sites-available/transporte-lanus
server {
    listen 80;
    server_name api.transporte-lanus.gov.ar;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.transporte-lanus.gov.ar;
    
    root /var/www/transporte-lanus/backend;
    index index.php;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # CORS headers
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
    
    # PHP handling
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        
        fastcgi_read_timeout 300;
        fastcgi_buffer_size 128k;
        fastcgi_buffers 4 256k;
        fastcgi_busy_buffers_size 256k;
    }
    
    # File upload limits
    client_max_body_size 50M;
    
    # Static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🗄️ DEPLOYMENT DEL BACKEND

### 1. Preparación del Código
```bash
# Clonar repositorio en el servidor
cd /var/www
git clone https://github.com/tu-usuario/transporte-lanus.git
cd transporte-lanus

# Configurar permisos
chown -R www-data:www-data backend/
chmod -R 755 backend/
chmod -R 777 backend/uploads/  # Para subida de archivos
```

### 2. Configuración de PHP
```ini
# /etc/php/8.1/apache2/php.ini (o fpm/php.ini para Nginx)
upload_max_filesize = 50M
post_max_size = 50M
max_execution_time = 300
memory_limit = 256M
max_input_vars = 3000

# Extensiones requeridas
extension=mysqli
extension=pdo_mysql
extension=gd
extension=json
extension=mbstring
```

### 3. Estructura de Archivos Backend
```
backend/
├── config/
│   ├── database.php          # Configuración DB
│   └── constants.php         # Constantes globales
├── api/
│   ├── login.php            # Endpoint login
│   ├── habilitaciones.php   # CRUD habilitaciones
│   └── guardar_inspeccion2.php
├── models/
│   ├── User.php
│   ├── Habilitacion.php
│   └── Inspeccion.php
├── uploads/                 # Archivos subidos
│   ├── images/
│   └── documents/
├── logs/                    # Logs del sistema
├── .htaccess               # Configuración Apache
└── index.php              # Punto de entrada
```

### 4. Archivo .htaccess
```apache
# backend/.htaccess
RewriteEngine On

# CORS Headers
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"

# Handle preflight OPTIONS requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Route API calls
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/$1.php [QSA,L]

# Security
<Files "*.php">
    Order allow,deny
    Allow from all
</Files>

<Files "config/*">
    Order deny,allow
    Deny from all
</Files>

# File upload limits
php_value upload_max_filesize 50M
php_value post_max_size 50M
php_value max_execution_time 300
```

---

## 📱 BUILD DE LA APLICACIÓN MOBILE

### 1. Configuración EAS
```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 2. Configuración de App
```json
// app.json
{
  "expo": {
    "name": "Transporte Lanús",
    "slug": "transporte-lanus",
    "version": "1.0.3",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "transportelanus",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.juliancancelo.habilitacionesLanus",
      "buildNumber": "1.0.3"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.jotacancelo.transportelanus",
      "versionCode": 3
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {},
      "eas": {
        "projectId": "12fd22e9-6d8a-4f5c-afc7-bfa9588f8a3f"
      }
    },
    "owner": "jotacancelo"
  }
}
```

### 3. Comandos de Build
```bash
# Instalar EAS CLI
npm install -g @expo/eas-cli

# Login en EAS
eas login

# Configurar proyecto
eas build:configure

# Build de desarrollo
eas build --platform android --profile development

# Build de preview
eas build --platform android --profile preview

# Build de producción
eas build --platform android --profile production

# Para iOS (requiere cuenta de desarrollador Apple)
eas build --platform ios --profile production
```

---

## 🗃️ CONFIGURACIÓN DE BASE DE DATOS

### 1. Instalación MySQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# Configuración inicial
sudo mysql_secure_installation
```

### 2. Creación de Base de Datos
```sql
-- Conectar como root
mysql -u root -p

-- Crear base de datos
CREATE DATABASE transporte_lanus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario
CREATE USER 'transporte_user'@'localhost' IDENTIFIED BY 'password_seguro_aqui';
GRANT ALL PRIVILEGES ON transporte_lanus.* TO 'transporte_user'@'localhost';
FLUSH PRIVILEGES;

-- Usar la base de datos
USE transporte_lanus;
```

### 3. Importar Esquema
```bash
# Importar estructura de tablas
mysql -u transporte_user -p transporte_lanus < database/schema.sql

# Importar datos iniciales
mysql -u transporte_user -p transporte_lanus < database/initial_data.sql
```

### 4. Script de Esquema (database/schema.sql)
```sql
-- Tabla usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'inspector', 'contribuyente') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla habilitaciones
CREATE TABLE habilitaciones (
    habilitacion_id INT PRIMARY KEY AUTO_INCREMENT,
    nro_licencia VARCHAR(50) UNIQUE NOT NULL,
    estado ENUM('HABILITADO', 'EN TRAMITE', 'VENCIDO', 'SUSPENDIDO') NOT NULL,
    tipo_transporte ENUM('Escolar', 'Remis') NOT NULL,
    titular_principal VARCHAR(100) NOT NULL,
    expte VARCHAR(50),
    vigencia_fin DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nro_licencia (nro_licencia),
    INDEX idx_estado (estado),
    INDEX idx_tipo_transporte (tipo_transporte)
);

-- Tabla inspecciones
CREATE TABLE inspecciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    habilitacion_id INT NOT NULL,
    inspector_id INT NOT NULL,
    estado ENUM('pendiente', 'en_proceso', 'finalizado') NOT NULL,
    resultado ENUM('aprobado', 'rechazado', 'pendiente') DEFAULT 'pendiente',
    fecha_inspeccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    firma_inspector LONGTEXT,
    firma_contribuyente LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (habilitacion_id) REFERENCES habilitaciones(habilitacion_id) ON DELETE CASCADE,
    FOREIGN KEY (inspector_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_habilitacion (habilitacion_id),
    INDEX idx_inspector (inspector_id),
    INDEX idx_fecha (fecha_inspeccion)
);

-- Tabla items_inspeccion
CREATE TABLE items_inspeccion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inspeccion_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50),
    estado ENUM('bien', 'mal', 'no_aplica') NOT NULL,
    observacion TEXT,
    foto LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspeccion_id) REFERENCES inspecciones(id) ON DELETE CASCADE,
    INDEX idx_inspeccion (inspeccion_id)
);

-- Tabla fotos_vehiculo
CREATE TABLE fotos_vehiculo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inspeccion_id INT NOT NULL,
    tipo ENUM('frente', 'contrafrente', 'lateral_izq', 'lateral_der', 'adicional') NOT NULL,
    foto LONGTEXT NOT NULL,
    ubicacion VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspeccion_id) REFERENCES inspecciones(id) ON DELETE CASCADE,
    INDEX idx_inspeccion (inspeccion_id)
);

-- Tabla turnos
CREATE TABLE turnos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    habilitacion_id INT NOT NULL,
    fecha_turno DATETIME NOT NULL,
    estado ENUM('Pendiente', 'Confirmado', 'Finalizado', 'Cancelado') DEFAULT 'Pendiente',
    inspector_asignado INT,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (habilitacion_id) REFERENCES habilitaciones(habilitacion_id) ON DELETE CASCADE,
    FOREIGN KEY (inspector_asignado) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_habilitacion (habilitacion_id),
    INDEX idx_fecha_turno (fecha_turno),
    INDEX idx_estado (estado)
);

-- Tabla historial
CREATE TABLE historial (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nro_licencia VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    nombre_titular VARCHAR(100) NOT NULL,
    dominio VARCHAR(20),
    resultado ENUM('aprobado', 'rechazado') NOT NULL,
    expediente VARCHAR(50),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nro_licencia (nro_licencia),
    INDEX idx_fecha (fecha),
    INDEX idx_resultado (resultado)
);
```

---

## 🔐 VARIABLES DE ENTORNO

### 1. Backend (.env)
```bash
# Database Configuration
DB_HOST=localhost
DB_NAME=transporte_lanus
DB_USER=transporte_user
DB_PASS=password_seguro_aqui
DB_PORT=3306

# API Configuration
API_BASE_URL=https://api.transporte-lanus.gov.ar
API_VERSION=v1
API_TIMEOUT=30

# Security
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
ENCRYPTION_KEY=tu_encryption_key_aqui
HASH_SALT=tu_hash_salt_aqui

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@lanus.gov.ar
SMTP_PASS=password_email
SMTP_FROM=noreply@lanus.gov.ar
SMTP_FROM_NAME="Sistema Transporte Lanús"

# File Upload
UPLOAD_MAX_SIZE=50M
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,pdf
UPLOAD_PATH=/var/www/transporte-lanus/backend/uploads

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/www/transporte-lanus/backend/logs/app.log
ERROR_LOG=/var/www/transporte-lanus/backend/logs/error.log

# Environment
ENVIRONMENT=production
DEBUG=false
```

### 2. Frontend (.env)
```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://api.transporte-lanus.gov.ar
EXPO_PUBLIC_API_TIMEOUT=30000

# App Configuration
EXPO_PUBLIC_APP_NAME="Transporte Lanús"
EXPO_PUBLIC_APP_VERSION=1.0.3

# Features
EXPO_PUBLIC_ENABLE_OFFLINE=true
EXPO_PUBLIC_ENABLE_GEOLOCATION=true
EXPO_PUBLIC_ENABLE_CAMERA=true

# Development
EXPO_PUBLIC_DEBUG=false
EXPO_PUBLIC_LOG_LEVEL=warn
```

---

## 🔒 SSL Y SEGURIDAD

### 1. Certificado SSL con Let's Encrypt
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-apache

# Obtener certificado
sudo certbot --apache -d api.transporte-lanus.gov.ar

# Renovación automática
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Configuración de Seguridad
```apache
# Security headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-XSS-Protection "1; mode=block"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

# Hide server information
ServerTokens Prod
ServerSignature Off
```

### 3. Firewall Configuration
```bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3306 # Solo desde IPs específicas

# Bloquear acceso directo a archivos sensibles
sudo ufw deny from any to any port 3306 # Excepto localhost
```

---

## 📊 MONITOREO Y LOGS

### 1. Configuración de Logs
```php
// backend/config/logging.php
<?php
class Logger {
    private static $logFile = '/var/www/transporte-lanus/backend/logs/app.log';
    private static $errorFile = '/var/www/transporte-lanus/backend/logs/error.log';
    
    public static function info($message) {
        self::writeLog('INFO', $message, self::$logFile);
    }
    
    public static function error($message) {
        self::writeLog('ERROR', $message, self::$errorFile);
    }
    
    private static function writeLog($level, $message, $file) {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
        file_put_contents($file, $logEntry, FILE_APPEND | LOCK_EX);
    }
}
?>
```

### 2. Logrotate Configuration
```bash
# /etc/logrotate.d/transporte-lanus
/var/www/transporte-lanus/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload apache2
    endscript
}
```

### 3. Monitoring Script
```bash
#!/bin/bash
# /usr/local/bin/monitor-transporte.sh

# Check API health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.transporte-lanus.gov.ar/health.php)

if [ $API_STATUS -ne 200 ]; then
    echo "API is down! Status: $API_STATUS" | mail -s "API Alert" admin@lanus.gov.ar
fi

# Check database connection
mysql -u transporte_user -p$DB_PASS -e "SELECT 1" transporte_lanus > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "Database connection failed!" | mail -s "DB Alert" admin@lanus.gov.ar
fi

# Check disk space
DISK_USAGE=$(df /var/www | awk 'NR==2 {print $5}' | sed 's/%//')

if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage is at $DISK_USAGE%" | mail -s "Disk Alert" admin@lanus.gov.ar
fi
```

---

## 💾 BACKUP Y RECUPERACIÓN

### 1. Script de Backup
```bash
#!/bin/bash
# /usr/local/bin/backup-transporte.sh

BACKUP_DIR="/var/backups/transporte-lanus"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="transporte_lanus"
DB_USER="transporte_user"
DB_PASS="password_seguro_aqui"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Files backup
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/transporte-lanus/backend/uploads/

# Remove old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# Log backup
echo "$(date): Backup completed - $DATE" >> /var/log/transporte-backup.log
```

### 2. Cron Job para Backup
```bash
# Backup diario a las 2 AM
0 2 * * * /usr/local/bin/backup-transporte.sh

# Backup semanal completo los domingos a las 1 AM
0 1 * * 0 /usr/local/bin/full-backup-transporte.sh
```

### 3. Script de Restauración
```bash
#!/bin/bash
# /usr/local/bin/restore-transporte.sh

BACKUP_FILE=$1
DB_NAME="transporte_lanus"
DB_USER="transporte_user"
DB_PASS="password_seguro_aqui"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

# Restore database
zcat $BACKUP_FILE | mysql -u $DB_USER -p$DB_PASS $DB_NAME

echo "Database restored from $BACKUP_FILE"
```

---

## 🔧 TROUBLESHOOTING

### Problemas Comunes

#### 1. Error 500 - Internal Server Error
```bash
# Verificar logs de Apache
sudo tail -f /var/log/apache2/error.log

# Verificar logs de PHP
sudo tail -f /var/log/php8.1-fpm.log

# Verificar permisos
ls -la /var/www/transporte-lanus/backend/
```

#### 2. Error de Conexión a Base de Datos
```bash
# Verificar estado de MySQL
sudo systemctl status mysql

# Probar conexión
mysql -u transporte_user -p transporte_lanus

# Verificar configuración
cat /var/www/transporte-lanus/backend/config/database.php
```

#### 3. Problemas de CORS
```apache
# Verificar headers en .htaccess
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
```

#### 4. Error de Subida de Archivos
```bash
# Verificar límites PHP
php -i | grep upload_max_filesize
php -i | grep post_max_size

# Verificar permisos de directorio
chmod 777 /var/www/transporte-lanus/backend/uploads/
```

### Comandos Útiles

```bash
# Reiniciar servicios
sudo systemctl restart apache2
sudo systemctl restart mysql
sudo systemctl restart php8.1-fpm

# Verificar estado
sudo systemctl status apache2
sudo systemctl status mysql

# Verificar logs en tiempo real
sudo tail -f /var/log/apache2/access.log
sudo tail -f /var/log/apache2/error.log
sudo tail -f /var/www/transporte-lanus/backend/logs/app.log

# Verificar espacio en disco
df -h
du -sh /var/www/transporte-lanus/

# Verificar procesos
ps aux | grep apache
ps aux | grep mysql
```

---

## 📋 CHECKLIST DE DEPLOYMENT

### Pre-deployment
- [ ] Código actualizado en repositorio
- [ ] Variables de entorno configuradas
- [ ] Base de datos respaldada
- [ ] Certificados SSL válidos
- [ ] Permisos de archivos correctos

### Deployment
- [ ] Código desplegado en servidor
- [ ] Base de datos migrada
- [ ] Configuración de servidor web
- [ ] Variables de entorno aplicadas
- [ ] Servicios reiniciados

### Post-deployment
- [ ] API funcionando correctamente
- [ ] Base de datos accesible
- [ ] Logs configurados
- [ ] Backup programado
- [ ] Monitoreo activo
- [ ] App móvil construida y distribuida

---

*Guía de deployment generada el: ${new Date().toLocaleDateString('es-AR')}*
*Versión del sistema: 1.0.3*
