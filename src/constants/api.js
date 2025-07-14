// =================================================================
// ARCHIVO: src/constants/api.ts (v3.1 - Con APIs de Turnos)
// Contiene todas las URLs de los endpoints de la API.
// =================================================================

// --- URLs Base ---
// URL principal para la aplicación de contribuyentes y la nueva API.
export const API_BASE_URL = 'https://api.transportelanus.com.ar/v2';
// URL específica para el sistema de inspecciones.
export const API_INSPECCIONES_BASE_URL = 'https://credenciales.transportelanus.com.ar/api';
// URL para la página de verificación de credenciales públicas.
export const CREDENCIAL_VERIFY_URL = 'https://credenciales.transportelanus.com.ar/credencial.php';


// =================================
// --- Endpoints de Autenticación ---
// =================================

// Login para contribuyentes (App Pública)
export const API_MANUAL_LOGIN_URL = `${API_BASE_URL}/login_manual.php`;
export const API_QR_LOGIN_URL = `${API_BASE_URL}/login_qr.php`;

// Login para personal interno (Admin/Inspectores)
export const API_INTERNAL_LOGIN_URL = `${API_BASE_URL}/login_interno.php`;
export const API_LOGIN_URL = `${API_INSPECCIONES_BASE_URL}/login.php`; // Login del sistema de inspecciones antiguo


// =============================================
// --- Endpoints de la App del Contribuyente ---
// =============================================

export const API_LICENSES_URL = `${API_BASE_URL}/get_habilitaciones_por_dni.php`;
export const API_CREDENTIAL_DETAILS_URL = `${API_BASE_URL}/get_credential_details.php`;
export const API_NOTIFICATIONS_URL = `${API_BASE_URL}/get_notificaciones_por_dni.php`;
export const API_MARK_NOTIFICATIONS_READ_URL = `${API_BASE_URL}/marcar_notificaciones_leidas.php`;
export const API_SAVE_PUSH_TOKEN_URL = `${API_BASE_URL}/guardar_push_token.php`;

// --- NUEVAS APIS DE GESTIÓN DE TURNOS ---
export const API_APPOINTMENTS_URL = `${API_BASE_URL}/get_turnos2.php`;
export const API_CONFIRM_APPOINTMENT_URL = `${API_BASE_URL}/confirmar_turno.php`;


// ===========================================
// --- Endpoints de la App de Administrador/Inspecciones ---
// ===========================================

// Para el listado de inspecciones pendientes
export const API_TRAMITES_URL = `${API_INSPECCIONES_BASE_URL}/get_tramites.php`;

// Para la gestión de turnos en el dashboard de admin
export const API_GET_TURNOS_POR_FECHA_URL = `${API_INSPECCIONES_BASE_URL}/get_turnos_por_fecha.php`;
export const API_CREAR_TURNO_URL = `${API_INSPECCIONES_BASE_URL}/crear_turno.php`;
export const API_CANCELAR_TURNO_URL = `${API_INSPECCIONES_BASE_URL}/cancelar_turno.php`;

// Para el formulario de inspección
export const API_GUARDAR_URL = `${API_INSPECCIONES_BASE_URL}/guardar_inspeccion2.php`;

// Para el historial
export const API_HISTORY_DATA_URL = `${API_INSPECCIONES_BASE_URL}/ver_historial.php`;
