# 🚌 Sistema de Gestión de Habilitaciones de Transporte - Lanús

> Aplicación móvil para la digitalización de inspecciones vehiculares y gestión de habilitaciones de transporte público y escolar en el municipio de Lanús.

[![Version](https://img.shields.io/badge/version-1.0.3-blue.svg)]()
[![React Native](https://img.shields.io/badge/React%20Native-0.74-blue.svg)]()
[![Expo](https://img.shields.io/badge/Expo-SDK%2051-black.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)]()
[![License](https://img.shields.io/badge/license-Municipal-green.svg)]()

## 📋 Descripción

Sistema integral para la gestión de habilitaciones de transporte que permite:

- **Inspecciones digitales** con formularios dinámicos
- **Captura fotográfica** de vehículos e infracciones
- **Firmas digitales** para validación de inspecciones
- **Trabajo offline** para inspecciones en campo
- **Dashboard administrativo** con métricas en tiempo real
- **Gestión de turnos** y programación de inspecciones
- **Historial completo** para auditoría y trazabilidad

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18.x o superior
- npm o yarn
- Expo CLI
- Android Studio (para Android) o Xcode (para iOS)

### Instalación

```bash
# Clonar el repositorio
git clone [URL_REPOSITORIO]
cd TransporteLanusExpo

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm start
```

### Comandos Disponibles

```bash
npm start          # Iniciar servidor de desarrollo
npm run android    # Ejecutar en Android
npm run ios        # Ejecutar en iOS
npm run web        # Ejecutar en web
npm run lint       # Ejecutar linter
```

## 🏗️ Arquitectura

### Stack Tecnológico

**Frontend:**
- React Native 0.74.x
- Expo SDK 51
- TypeScript 5.3.x
- React Navigation 6.x
- React Query 4.x
- React Native Paper 5.x
- Expo Router 3.x

**Backend:**
- PHP 8.1+
- MySQL 8.0+
- REST API
- JWT Authentication

### Estructura del Proyecto

```
TransporteLanusExpo/
├── 📱 app/                    # Rutas y pantallas
│   ├── (admin)/              # Módulo administrador
│   ├── (inspector)/          # Módulo inspector
│   ├── (contribuyente)/      # Módulo contribuyente
│   └── _layout.tsx           # Layout principal
├── 🎨 src/                   # Código fuente
│   ├── components/           # Componentes reutilizables
│   ├── contexts/            # Contextos React
│   ├── hooks/               # Hooks personalizados
│   ├── services/            # Servicios y APIs
│   ├── types/               # Tipos TypeScript
│   └── constants/           # Constantes
├── 🗄️ backend/               # Backend PHP
├── 🎯 assets/                # Assets estáticos
├── 📚 docs/                  # Documentación
└── ⚙️ Configuración          # Archivos de config
```

## 👥 Roles de Usuario

### 👮 Inspector
- Realizar inspecciones vehiculares
- Capturar fotos y firmas digitales
- Trabajar en modo offline
- Gestionar inspecciones asignadas

### 👨‍💼 Administrador
- Dashboard con métricas completas
- Gestión de habilitaciones
- Asignación de turnos
- Generación de reportes
- Supervisión del sistema

### 🚗 Contribuyente
- Consultar estado de habilitaciones
- Gestionar turnos de inspección
- Ver historial de inspecciones
- Recibir notificaciones

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

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
```

### Configuración del Backend

Ver [Guía de Deployment](./docs/DEPLOYMENT_GUIDE.md) para configuración completa del servidor.

## 📱 Funcionalidades Principales

### Sistema de Inspecciones
- ✅ Formularios dinámicos por tipo de vehículo
- ✅ Evaluación por ítems (Bien/Mal/No Aplica)
- ✅ Captura de 4 fotos obligatorias + 1 opcional
- ✅ Firmas digitales de inspector y contribuyente
- ✅ Geolocalización automática
- ✅ Trabajo offline con sincronización

### Gestión de Habilitaciones
- ✅ Estados: Habilitado, En Trámite, Vencido, Suspendido
- ✅ Filtros por tipo de transporte (Escolar/Remis)
- ✅ Búsqueda por número de licencia
- ✅ Historial completo de cambios

### Dashboard Administrativo
- ✅ Métricas en tiempo real
- ✅ Gráficos y estadísticas
- ✅ Gestión de turnos
- ✅ Reportes exportables

## 🔒 Seguridad

- **Autenticación**: JWT tokens seguros
- **Autorización**: Control de acceso por roles
- **Validación**: Sanitización de datos en frontend y backend
- **Encriptación**: Datos sensibles encriptados
- **Auditoría**: Log completo de todas las operaciones

## 📊 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests end-to-end
npm run test:e2e
```

## 🚀 Deployment

### Build de Desarrollo
```bash
eas build --platform android --profile development
```

### Build de Producción
```bash
eas build --platform android --profile production
```

Ver [Guía de Deployment](./docs/DEPLOYMENT_GUIDE.md) para instrucciones completas.

## 📚 Documentación

- 📋 [Documentación Técnica Completa](./DOCUMENTACION_TECNICA.md)
- 🔌 [Documentación de API](./docs/API_DOCUMENTATION.md)
- 🚀 [Guía de Deployment](./docs/DEPLOYMENT_GUIDE.md)
- 📱 [Manual de Usuario](./docs/MANUAL_USUARIO.md)

## 🤝 Contribución

### Flujo de Desarrollo

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Add nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Estándares de Código

- **ESLint**: Para linting de JavaScript/TypeScript
- **Prettier**: Para formateo de código
- **Conventional Commits**: Para mensajes de commit
- **TypeScript**: Tipado estricto obligatorio

## 🐛 Reportar Problemas

Para reportar bugs o solicitar funcionalidades:

1. Busca en [Issues existentes](../../issues)
2. Si no existe, crea un [Nuevo Issue](../../issues/new)
3. Incluye:
   - Descripción detallada
   - Pasos para reproducir
   - Capturas de pantalla
   - Información del dispositivo

## 📞 Soporte

- **Email**: soporte.transporte@lanus.gov.ar
- **Teléfono**: (011) 4225-5000 int. 1234
- **Horario**: Lunes a Viernes, 8:00 a 16:00 hs

## 📄 Licencia

Este proyecto es propiedad del Municipio de Lanús y está destinado exclusivamente para uso oficial.

## 🏆 Créditos

**Desarrollado para:**
Municipio de Lanús - Secretaría de Transporte

**Equipo de Desarrollo:**
- Desarrollo Principal: [Nombre]
- UI/UX Design: [Nombre]
- Backend Development: [Nombre]
- Testing: [Nombre]

---

## 📈 Roadmap

### v1.1.0 (Próximo Release)
- [ ] Notificaciones push
- [ ] Modo offline mejorado
- [ ] Reportes en PDF
- [ ] Geolocalización en inspecciones

### v1.2.0 (Futuro)
- [ ] Dashboard analytics avanzado
- [ ] Sistema de mensajería
- [ ] API REST completa
- [ ] Tests automatizados

### v2.0.0 (Largo Plazo)
- [ ] Integración con sistemas municipales
- [ ] Machine Learning para detección automática
- [ ] App web complementaria
- [ ] Módulo de facturación

---

*Última actualización: ${new Date().toLocaleDateString('es-AR')}*
*Versión: 1.0.3*
