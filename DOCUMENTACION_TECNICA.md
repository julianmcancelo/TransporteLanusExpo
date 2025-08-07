# 📋 DOCUMENTACIÓN TÉCNICA COMPLETA
## Sistema de Gestión de Habilitaciones de Transporte - Lanús

---

## 📑 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Configuración y Setup](#configuración-y-setup)
6. [API y Backend](#api-y-backend)
7. [Frontend - React Native](#frontend---react-native)
8. [Base de Datos](#base-de-datos)
9. [Funcionalidades Principales](#funcionalidades-principales)
10. [Seguridad](#seguridad)
11. [Deployment](#deployment)
12. [Mantenimiento](#mantenimiento)

---

## 🎯 RESUMEN EJECUTIVO

### Propósito
Sistema móvil para la gestión de habilitaciones de transporte público y escolar en el municipio de Lanús. Permite a inspectores realizar inspecciones vehiculares y a administradores gestionar el proceso completo.

### Características Principales
- **Inspecciones vehiculares digitales** con formularios dinámicos
- **Gestión de habilitaciones** para transporte escolar y remis
- **Sistema de firmas digitales** para inspectores y contribuyentes
- **Captura fotográfica** de vehículos e infracciones
- **Sincronización offline/online** para trabajo en campo
- **Dashboard administrativo** con métricas y reportes
- **Historial de inspecciones** para auditoría

### Usuarios Objetivo
- **Inspectores municipales**: Realizan inspecciones en campo
- **Administradores**: Supervisan y gestionan el sistema
- **Contribuyentes**: Propietarios de vehículos de transporte

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Arquitectura General
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │◄──►│   PHP Backend   │◄──►│    MySQL DB     │
│   (Frontend)    │    │   (REST API)    │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Local Storage  │    │  File Storage   │    │   Backups       │
│  (AsyncStorage) │    │  (Images/Docs)  │    │   (Scheduled)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Patrón Arquitectónico
- **Cliente-Servidor**: Aplicación móvil como cliente, API REST como servidor
- **MVC en Backend**: Modelo-Vista-Controlador en PHP
- **Component-Based**: Arquitectura de componentes en React Native
- **State Management**: Context API + React Query para gestión de estado

---

## 🛠️ STACK TECNOLÓGICO

### Frontend (Mobile)
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React Native** | 0.74.x | Framework principal |
| **Expo** | SDK 51 | Desarrollo y build |
| **TypeScript** | 5.3.x | Tipado estático |
| **React Navigation** | 6.x | Navegación |
| **React Query** | 4.x | Gestión de estado servidor |
| **React Native Paper** | 5.x | Componentes UI |
| **React Native Reanimated** | 3.x | Animaciones |
| **Expo Router** | 3.x | Routing basado en archivos |

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **PHP** | 8.1+ | Lenguaje servidor |
| **MySQL** | 8.0+ | Base de datos |
| **Apache/Nginx** | Latest | Servidor web |
| **JSON** | - | Formato de intercambio |

---

## 📁 ESTRUCTURA DEL PROYECTO

```
TransporteLanusExpo/
├── 📱 app/                          # Rutas y pantallas principales
│   ├── (admin)/                     # Rutas administrativas
│   │   ├── _layout.tsx              # Layout admin
│   │   ├── dashboard.tsx            # Dashboard principal
│   │   └── [id].tsx                 # Detalle habilitación
│   ├── (inspector)/                 # Rutas inspector
│   │   ├── _layout.tsx              # Layout inspector
│   │   ├── inspecciones.tsx         # Lista inspecciones
│   │   ├── nueva-inspeccion.tsx     # Nueva inspección
│   │   ├── inspeccion-detalle.tsx   # Detalle inspección
│   │   ├── inspection-form.tsx      # Formulario inspección
│   │   └── gestion-legajo/          # Gestión de legajos
│   ├── (contribuyente)/             # Rutas contribuyente
│   │   ├── appointments.tsx         # Citas
│   │   └── home.tsx                 # Inicio contribuyente
│   ├── _layout.tsx                  # Layout raíz
│   ├── login.tsx                    # Pantalla login
│   └── index.tsx                    # Pantalla inicial
├── 🎨 src/                          # Código fuente
│   ├── components/                  # Componentes reutilizables
│   ├── contexts/                    # Contextos React
│   ├── hooks/                       # Hooks personalizados
│   ├── services/                    # Servicios y APIs
│   ├── types/                       # Definiciones TypeScript
│   ├── constants/                   # Constantes
│   └── utils/                       # Utilidades
├── 🗄️ backend/                      # Backend PHP
├── 🎯 assets/                       # Assets estáticos
└── ⚙️ Configuración                 # Archivos de configuración
```

---

## ⚙️ CONFIGURACIÓN Y SETUP

### Prerrequisitos
```bash
# Node.js (versión 18+)
node --version

# npm o yarn
npm --version

# Expo CLI
npm install -g @expo/cli

# Git
git --version
```

### Instalación
```bash
# 1. Clonar repositorio
git clone [URL_REPOSITORIO]
cd TransporteLanusExpo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Iniciar servidor de desarrollo
npm start
```

### Scripts Disponibles
```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "lint": "expo lint"
}
```

---

## 🔌 API Y BACKEND

### Endpoints Principales

#### Autenticación
```php
POST /api/login.php
Content-Type: application/json

{
  "email": "inspector@lanus.gov.ar",
  "password": "password123"
}

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "inspector@lanus.gov.ar",
    "rol": "inspector"
  }
}
```

#### Habilitaciones
```php
GET /api/habilitaciones.php?tipo=Escolar&buscar=ABC123

Response:
{
  "success": true,
  "data": [
    {
      "habilitacion_id": 1,
      "nro_licencia": "ABC123",
      "estado": "HABILITADO",
      "tipo_transporte": "Escolar",
      "titular_principal": "Juan Pérez"
    }
  ]
}
```

#### Inspecciones
```php
POST /api/guardar_inspeccion2.php
Content-Type: application/json

{
  "habilitacion_id": 1,
  "estado": "finalizado",
  "resultado": "aprobado",
  "items": [...],
  "fotos_vehiculo": {...},
  "firma_inspector": "base64_signature",
  "firma_contribuyente": "base64_signature"
}
```

---

## 🗄️ BASE DE DATOS

### Esquema Principal
```sql
-- Tabla usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'inspector', 'contribuyente') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    FOREIGN KEY (habilitacion_id) REFERENCES habilitaciones(habilitacion_id),
    FOREIGN KEY (inspector_id) REFERENCES usuarios(id)
);

-- Tabla historial (para auditoría)
CREATE TABLE historial (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nro_licencia VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    nombre_titular VARCHAR(100) NOT NULL,
    dominio VARCHAR(20),
    resultado ENUM('aprobado', 'rechazado') NOT NULL,
    expediente VARCHAR(50),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚡ FUNCIONALIDADES PRINCIPALES

### 1. Sistema de Autenticación
- Login con email/password
- Persistencia de sesión con AsyncStorage
- Roles de usuario (admin, inspector, contribuyente)
- Logout seguro

### 2. Gestión de Habilitaciones
- Lista paginada de habilitaciones
- Filtros por tipo de transporte
- Búsqueda por número de licencia
- Estados: HABILITADO, EN TRAMITE, VENCIDO, SUSPENDIDO

### 3. Sistema de Inspecciones
- Formularios dinámicos de inspección
- Captura de fotos del vehículo (4 ángulos + adicional)
- Sistema de firmas digitales
- Evaluación por ítems (bien/mal/no aplica)
- Sincronización offline/online

### 4. Dashboard Administrativo
- Métricas en tiempo real
- Segmentación por tipo de transporte
- Búsqueda y filtros avanzados
- Gestión de turnos

### 5. Historial y Auditoría
- Registro completo de inspecciones
- Trazabilidad de cambios
- Reportes exportables

---

## 🔒 SEGURIDAD

### Autenticación
- Validación de credenciales en backend
- Sesiones seguras con tokens
- Logout automático por inactividad

### Validación de Datos
- Sanitización de inputs
- Validación en frontend y backend
- Protección contra SQL injection

### Almacenamiento
- Datos sensibles encriptados
- AsyncStorage para datos locales
- Backup seguro de base de datos

---

## 🚀 DEPLOYMENT

### Desarrollo
```bash
npm start
```

### Build de Producción
```bash
# Android
eas build --platform android

# iOS
eas build --platform ios
```

### Configuración del Servidor
```apache
# .htaccess para PHP backend
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Headers CORS
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
```

---

## 🔧 MANTENIMIENTO

### Logs y Monitoreo
- Logs de errores en backend
- Métricas de uso en frontend
- Alertas automáticas por fallos

### Backup
- Backup diario de base de datos
- Versionado de código con Git
- Respaldo de imágenes y documentos

### Actualizaciones
- Versionado semántico
- Testing antes de deploy
- Rollback automático en caso de errores

---

## 🛠️ TROUBLESHOOTING

### Errores Comunes

#### Error de lineHeight undefined
**Causa**: Configuración incompleta de fuentes en React Native Paper
**Solución**: Verificar configuración de temas en `ThemeContext.tsx`

#### Error de conexión API
**Causa**: URL incorrecta o servidor caído
**Solución**: Verificar `API_BASE_URL` en configuración

#### Problemas de sincronización offline
**Causa**: Datos corruptos en AsyncStorage
**Solución**: Limpiar storage local y re-sincronizar

### Comandos Útiles
```bash
# Limpiar cache
npm start -- --clear

# Reset proyecto
npm run reset-project

# Logs detallados
npx expo start --dev-client
```

---

## 📈 ROADMAP Y MEJORAS FUTURAS

### Corto Plazo (1-3 meses)
- [ ] Notificaciones push
- [ ] Modo offline mejorado
- [ ] Reportes en PDF
- [ ] Geolocalización en inspecciones

### Mediano Plazo (3-6 meses)
- [ ] Dashboard analytics avanzado
- [ ] Sistema de mensajería
- [ ] API REST completa
- [ ] Tests automatizados

### Largo Plazo (6+ meses)
- [ ] Integración con sistemas municipales
- [ ] Machine Learning para detección automática
- [ ] App web complementaria
- [ ] Módulo de facturación

---

## 📞 CONTACTO Y SOPORTE

### Equipo de Desarrollo
- **Desarrollador Principal**: [Nombre]
- **Email**: desarrollo@lanus.gov.ar
- **Repositorio**: [URL_REPO]

### Documentación Adicional
- **API Documentation**: `/docs/api.md`
- **User Manual**: `/docs/manual-usuario.md`
- **Deployment Guide**: `/docs/deployment.md`

---

*Documentación generada el: ${new Date().toLocaleDateString('es-AR')}*
*Versión de la aplicación: 1.0.3*
