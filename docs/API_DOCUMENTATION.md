# 🔌 API DOCUMENTATION
## Sistema de Gestión de Habilitaciones de Transporte - Lanús

---

## 📋 ÍNDICE

1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Endpoints de Habilitaciones](#endpoints-de-habilitaciones)
4. [Endpoints de Inspecciones](#endpoints-de-inspecciones)
5. [Endpoints de Usuarios](#endpoints-de-usuarios)
6. [Códigos de Error](#códigos-de-error)
7. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🌐 INFORMACIÓN GENERAL

### Base URL
```
http://localhost/api
```

### Formato de Respuesta
Todas las respuestas de la API siguen el siguiente formato:

```json
{
  "success": boolean,
  "data": object|array|null,
  "message": string,
  "error": string|null,
  "timestamp": string
}
```

### Headers Requeridos
```
Content-Type: application/json
Accept: application/json
```

---

## 🔐 AUTENTICACIÓN

### POST /login.php
Autentica un usuario en el sistema.

#### Request
```json
{
  "email": "inspector@lanus.gov.ar",
  "password": "password123"
}
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "inspector@lanus.gov.ar",
      "rol": "inspector",
      "activo": true,
      "created_at": "2024-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login exitoso",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Response Error (401)
```json
{
  "success": false,
  "data": null,
  "message": "Credenciales inválidas",
  "error": "INVALID_CREDENTIALS",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🚗 ENDPOINTS DE HABILITACIONES

### GET /habilitaciones.php
Obtiene la lista de habilitaciones con filtros opcionales.

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `tipo` | string | No | Tipo de transporte: "Escolar" o "Remis" |
| `buscar` | string | No | Búsqueda por número de licencia |
| `estado` | string | No | Estado: "HABILITADO", "EN TRAMITE", "VENCIDO", "SUSPENDIDO" |
| `page` | integer | No | Número de página (default: 1) |
| `limit` | integer | No | Elementos por página (default: 20) |

#### Request Example
```
GET /habilitaciones.php?tipo=Escolar&buscar=ABC123&page=1&limit=10
```

#### Response Success (200)
```json
{
  "success": true,
  "data": [
    {
      "habilitacion_id": 1,
      "nro_licencia": "ABC123",
      "estado": "HABILITADO",
      "tipo_transporte": "Escolar",
      "titular_principal": "Juan Pérez",
      "expte": "EXP001",
      "vigencia_fin": "2024-12-31",
      "created_at": "2024-01-15T10:30:00Z",
      "turno": {
        "id": 1,
        "fecha_turno": "2024-02-15T09:00:00Z",
        "estado": "Pendiente",
        "inspector_asignado": null
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 47,
    "items_per_page": 10
  },
  "message": "Habilitaciones obtenidas exitosamente",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /habilitaciones.php?id={id}
Obtiene una habilitación específica por ID.

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "habilitacion_id": 1,
    "nro_licencia": "ABC123",
    "estado": "HABILITADO",
    "tipo_transporte": "Escolar",
    "titular_principal": "Juan Pérez",
    "titular": {
      "nombre": "Juan Pérez",
      "email": "juan.perez@email.com",
      "telefono": "+54 11 1234-5678",
      "direccion": "Av. Hipólito Yrigoyen 1234, Lanús"
    },
    "vehiculo": {
      "dominio": "ABC123",
      "marca": "Mercedes Benz",
      "modelo": "Sprinter",
      "año": 2020,
      "color": "Blanco",
      "capacidad": 19
    },
    "expte": "EXP001",
    "vigencia_fin": "2024-12-31",
    "inspecciones": [
      {
        "id": 1,
        "fecha_inspeccion": "2024-01-10T14:30:00Z",
        "resultado": "aprobado",
        "inspector": "María González"
      }
    ]
  },
  "message": "Habilitación obtenida exitosamente",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 📋 ENDPOINTS DE INSPECCIONES

### POST /guardar_inspeccion2.php
Guarda una nueva inspección o actualiza una existente.

#### Request
```json
{
  "habilitacion_id": 1,
  "estado": "finalizado",
  "resultado": "aprobado",
  "turno": {
    "id": 1,
    "estado": "Finalizado",
    "fecha_finalizacion": "2024-01-15T15:30:00Z"
  },
  "turno_id": 1,
  "turno_estado": "Finalizado",
  "actualizar_turno": true,
  "estado_anterior_turno": "Confirmado",
  "nro_licencia": "ABC123",
  "nombre_inspector": "María González",
  "firma_inspector": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "firma_contribuyente": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "status_inspeccion": "Finalizado",
  "fecha_finalizacion": "2024-01-15T15:30:00Z",
  "fotos_vehiculo": {
    "frente": {
      "foto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
      "location": "-34.7024,-58.3960"
    },
    "contrafrente": {
      "foto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
      "location": "-34.7024,-58.3960"
    },
    "lateral_izq": {
      "foto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
      "location": "-34.7024,-58.3960"
    },
    "lateral_der": {
      "foto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
      "location": "-34.7024,-58.3960"
    }
  },
  "foto_adicional": {
    "foto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "location": "-34.7024,-58.3960"
  },
  "tipo_transporte": "Escolar",
  "email_contribuyente": "juan.perez@email.com",
  "titular": {
    "nombre": "Juan Pérez",
    "email": "juan.perez@email.com",
    "telefono": "+54 11 1234-5678"
  },
  "vehiculo": {
    "dominio": "ABC123",
    "marca": "Mercedes Benz",
    "modelo": "Sprinter"
  },
  "sendEmailCopy": true,
  "items": [
    {
      "id": 1,
      "nombre": "Luces delanteras",
      "categoria": "Iluminación",
      "estado": "bien",
      "observacion": "En perfecto estado",
      "foto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
      "location": "-34.7024,-58.3960"
    },
    {
      "id": 2,
      "nombre": "Frenos",
      "categoria": "Seguridad",
      "estado": "mal",
      "observacion": "Pastillas desgastadas, requiere cambio inmediato",
      "foto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
      "location": "-34.7024,-58.3960"
    }
  ]
}
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "inspeccion_id": 15,
    "habilitacion_id": 1,
    "resultado": "rechazado",
    "fecha_inspeccion": "2024-01-15T15:30:00Z",
    "turno_actualizado": true,
    "historial_creado": true,
    "email_enviado": true
  },
  "message": "Inspección guardada exitosamente",
  "timestamp": "2024-01-15T15:30:00Z"
}
```

### GET /inspecciones.php
Obtiene la lista de inspecciones.

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `inspector_id` | integer | No | ID del inspector |
| `estado` | string | No | Estado de la inspección |
| `fecha_desde` | string | No | Fecha desde (YYYY-MM-DD) |
| `fecha_hasta` | string | No | Fecha hasta (YYYY-MM-DD) |

#### Response Success (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "habilitacion_id": 1,
      "nro_licencia": "ABC123",
      "inspector": "María González",
      "estado": "finalizado",
      "resultado": "rechazado",
      "fecha_inspeccion": "2024-01-15T15:30:00Z",
      "observaciones": "Frenos en mal estado"
    }
  ],
  "message": "Inspecciones obtenidas exitosamente",
  "timestamp": "2024-01-15T15:30:00Z"
}
```

---

## 👥 ENDPOINTS DE USUARIOS

### GET /usuarios.php
Obtiene la lista de usuarios (solo para administradores).

#### Response Success (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "María González",
      "email": "maria.gonzalez@lanus.gov.ar",
      "rol": "inspector",
      "activo": true,
      "created_at": "2024-01-10T09:00:00Z"
    }
  ],
  "message": "Usuarios obtenidos exitosamente",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /usuarios.php
Crea un nuevo usuario (solo para administradores).

#### Request
```json
{
  "nombre": "Carlos Rodríguez",
  "email": "carlos.rodriguez@lanus.gov.ar",
  "password": "password123",
  "rol": "inspector"
}
```

#### Response Success (201)
```json
{
  "success": true,
  "data": {
    "id": 5,
    "nombre": "Carlos Rodríguez",
    "email": "carlos.rodriguez@lanus.gov.ar",
    "rol": "inspector",
    "activo": true
  },
  "message": "Usuario creado exitosamente",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## ❌ CÓDIGOS DE ERROR

### Códigos HTTP
| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Solicitud malformada |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 422 | Unprocessable Entity - Error de validación |
| 500 | Internal Server Error - Error del servidor |

### Códigos de Error Personalizados
| Código | Descripción |
|--------|-------------|
| `INVALID_CREDENTIALS` | Credenciales de login inválidas |
| `USER_NOT_FOUND` | Usuario no encontrado |
| `HABILITACION_NOT_FOUND` | Habilitación no encontrada |
| `INVALID_ROLE` | Rol de usuario inválido |
| `MISSING_REQUIRED_FIELD` | Campo requerido faltante |
| `INVALID_DATE_FORMAT` | Formato de fecha inválido |
| `DATABASE_ERROR` | Error en la base de datos |
| `FILE_UPLOAD_ERROR` | Error al subir archivo |
| `INVALID_IMAGE_FORMAT` | Formato de imagen inválido |

---

## 💡 EJEMPLOS DE USO

### Flujo Completo de Inspección

#### 1. Login del Inspector
```javascript
const loginResponse = await fetch('/api/login.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'inspector@lanus.gov.ar',
    password: 'password123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.data.token;
```

#### 2. Obtener Habilitaciones
```javascript
const habilitacionesResponse = await fetch('/api/habilitaciones.php?tipo=Escolar', {
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const habilitaciones = await habilitacionesResponse.json();
```

#### 3. Realizar Inspección
```javascript
const inspeccionData = {
  habilitacion_id: 1,
  estado: 'finalizado',
  resultado: 'aprobado',
  items: [
    {
      id: 1,
      nombre: 'Luces delanteras',
      estado: 'bien',
      observacion: 'En buen estado'
    }
  ],
  firma_inspector: 'base64_signature',
  fotos_vehiculo: {
    frente: { foto: 'base64_image', location: 'lat,lng' }
  }
};

const inspeccionResponse = await fetch('/api/guardar_inspeccion2.php', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(inspeccionData)
});
```

### Manejo de Errores
```javascript
try {
  const response = await fetch('/api/habilitaciones.php');
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Error desconocido');
  }
  
  return data.data;
} catch (error) {
  console.error('Error en API:', error.message);
  throw error;
}
```

---

## 📝 NOTAS IMPORTANTES

### Límites de Tamaño
- **Imágenes**: Máximo 5MB por imagen
- **Firmas**: Máximo 1MB por firma
- **Request total**: Máximo 50MB

### Formatos Soportados
- **Imágenes**: JPEG, PNG
- **Firmas**: PNG (recomendado)
- **Coordenadas**: Formato "lat,lng" (ej: "-34.7024,-58.3960")

### Rate Limiting
- **Máximo 100 requests por minuto** por IP
- **Máximo 1000 requests por hora** por usuario autenticado

---

*Documentación de API generada el: ${new Date().toLocaleDateString('es-AR')}*
*Versión de la API: 1.0.3*
