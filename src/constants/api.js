// =================================================================
// ARCHIVO: src/constants/api.ts (v4.0 - Organizado y Refactorizado)
//
// Propósito: Centraliza todas las URLs de los endpoints de la API
// para facilitar el mantenimiento y asegurar la consistencia.
// =================================================================

// -----------------------------------------------------------------
// --- URLs Base de los Sistemas ---
// -----------------------------------------------------------------

// URL principal para la nueva API (Sistema V2), usada por la app del contribuyente.
export const API_V2_BASE_URL = 'https://api.transportelanus.com.ar/v2';

// URL para el sistema de inspecciones (sistema anterior), usada por la app de inspectores/admin.
export const API_INSPECCIONES_BASE_URL = 'https://credenciales.transportelanus.com.ar/api';

// URL del sitio público para verificación de credenciales.
export const PUBLIC_SITE_BASE_URL = 'https://credenciales.transportelanus.com.ar';


// =================================================================
// --- URLs Públicas ---
// =================================================================

// Página de verificación de credenciales para el público general.
export const CREDENCIAL_VERIFY_URL = `${PUBLIC_SITE_BASE_URL}/credencial.php`;


// =================================================================
// --- Endpoints de Autenticación ---
// =================================================================

// --- Login para Contribuyentes (App Pública - Sistema V2) ---
export const API_MANUAL_LOGIN_URL = `${API_V2_BASE_URL}/login_manual.php`;
export const API_QR_LOGIN_URL = `${API_V2_BASE_URL}/login_qr.php`;

// --- Login para Personal Interno ---
export const API_INTERNAL_LOGIN_URL = `${API_V2_BASE_URL}/login_interno.php`; // Para Admin en la nueva app
export const API_INSPECTOR_LOGIN_URL = `${API_INSPECCIONES_BASE_URL}/login.php`; // Para Inspectores en el sistema antiguo


// =================================================================
// --- API para la App del Contribuyente (Sistema V2) ---
// =================================================================

// --- Habilitaciones y Credenciales ---
export const API_LICENSES_URL = `${API_V2_BASE_URL}/get_habilitaciones_por_dni.php`;
export const API_CREDENTIAL_DETAILS_URL = `${API_V2_BASE_URL}/get_credential_details.php`;

// --- Notificaciones ---
export const API_NOTIFICATIONS_URL = `${API_V2_BASE_URL}/get_notificaciones_por_dni.php`;
export const API_MARK_NOTIFICATIONS_READ_URL = `${API_V2_BASE_URL}/marcar_notificaciones_leidas.php`;
export const API_SAVE_PUSH_TOKEN_URL = `${API_V2_BASE_URL}/guardar_push_token.php`;

// --- Gestión de Turnos del Contribuyente ---
export const API_APPOINTMENTS_URL = `${API_V2_BASE_URL}/get_turnos2.php`;
export const API_CONFIRM_APPOINTMENT_URL = `${API_V2_BASE_URL}/confirmar_turno.php`;


// =================================================================
// --- API para la App de Administrador/Inspectores (Sistema de Inspecciones) ---
// =================================================================

// --- Gestión de Turnos (Panel Interno) ---
export const API_GET_TURNOS_POR_FECHA_URL = `${API_INSPECCIONES_BASE_URL}/get_turnos_por_fecha.php`;
export const API_CREAR_TURNO_URL = `${API_INSPECCIONES_BASE_URL}/crear_turno.php`;
export const API_CANCELAR_TURNO_URL = `${API_INSPECCIONES_BASE_URL}/cancelar_turno.php`;

// --- Proceso de Inspección ---
export const API_GET_PENDING_INSPECTIONS_URL = `${API_INSPECCIONES_BASE_URL}/get_turnos_pendientes.php`;
export const API_SAVE_INSPECTION_URL = `${API_INSPECCIONES_BASE_URL}/guardar_inspeccion2.php`;

// --- Historial ---
export const API_HISTORY_DATA_URL = `${API_INSPECCIONES_BASE_URL}/ver_historial.php`;
