// =================================================================
// ARCHIVO: src/services/api.ts (v7.0 - Versión de Producción)
//
// Propósito: Centraliza toda la comunicación con la API del backend.
// Este archivo actúa como una capa de servicio que la aplicación
// utiliza para obtener y enviar datos.
// =================================================================

import axios, { AxiosError } from 'axios';
import { Habilitacion as HabilitacionType, HabilitacionDetalle as HabilitacionDetalleType, MapPoint as MapPointType } from '../types/habilitacion';
// import { ENDPOINT_VALIDAR_QR } from '../constants/api'; // Temporarily disabled

// Función para obtener el token de autenticación almacenado
const getAuthTokenFromStorage = async (): Promise<string | null> => {
    try {
        // import * as SecureStore from 'expo-secure-store';
        // return await SecureStore.getItemAsync('userAuthToken');
        const token = localStorage.getItem('userAuthToken');
        return token;
    } catch (error) {
        console.error('Error al recuperar token de autenticación:', error);
        return null;
    }
};

// =================================================================
// --- INTERFACES DE TIPOS DE DATOS ---
// =================================================================

// Exportamos los tipos desde el archivo original para mantener consistencia
export type { Habilitacion, HabilitacionDetalle, MapPoint } from '../types/habilitacion';

// Interfaz para la configuración del sistema
export interface SystemConfig {
  id: string;
  appName: string;
  appVersion: string;
  lastBackup: string;
  maintenance: boolean;
  debugging: boolean;
  logLevel: 'info' | 'warn' | 'error';
  apiTimeout: number;
  autoBackup: boolean;
  restrictedAccess: boolean;
  apiStatus: string;
}

// Interfaz para usuarios administradores
export interface AdminUser {
    id: number;
    nombre: string;
    usuario: string;
    email: string;
    telefono?: string;
    rol: 'master' | 'admin' | 'inspector';
    estado: 'activo' | 'inactivo';
    ultimoAcceso?: string;
    avatarUrl?: string;
}

// Definimos la interfaz para los datos de validación de credenciales
export interface QRValidationResponse {
    success: boolean;
    message?: string;
    data?: {
        nombre: string;
        dni: string;
        licencia: string;
        vencimiento: string; // formato 'YYYY-MM-DD'
        estado: string;
    };
}


// =================================================================
// --- CONFIGURACIÓN DEL CLIENTE AXIOS ---
// =================================================================

// URL base del único punto de entrada de la API en el servidor
const API_BASE_URL = 'https://api.transportelanus.com.ar/admin/api.php';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Interceptor de Solicitud (Request Interceptor) ---
// Se ejecuta ANTES de que cada solicitud sea enviada.
// Su propósito es añadir el token de autenticación a las cabeceras.
apiClient.interceptors.request.use(async (config) => {
    const authToken = await getAuthTokenFromStorage();
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// --- Interceptor de Respuesta (Response Interceptor) ---
// Se ejecuta DESPUÉS de recibir una respuesta, para manejar errores globalmente.
apiClient.interceptors.response.use(
    (response) => response, // Si la respuesta es exitosa (2xx), la devuelve tal cual.
    (error: AxiosError) => {
        // Si hay un error, lo procesamos para que sea más fácil de manejar en la app.
        const errorMessage = (error.response?.data as any)?.message || error.message || 'Ocurrió un error desconocido.';
        console.error('[API Error Interceptor]:', errorMessage);
        // Rechazamos la promesa con un mensaje de error limpio.
        return Promise.reject(new Error(errorMessage));
    }
);


// =================================================================
// --- FUNCIONES DEL SERVICIO DE API ---
// =================================================================

/**
 * Obtiene la lista de habilitaciones según filtros.
 * Corresponde al `recurso=habilitaciones` con método GET.
 */
export const getHabilitaciones = async (params: { tipo: string; ordenar?: string; buscar?: string; }): Promise<HabilitacionType[]> => {
    const response = await apiClient.get('', { params: { recurso: 'habilitaciones', ...params } });
    return response.data;
};

/**
 * Obtiene el detalle completo de una única habilitación por su ID.
 * Corresponde al `recurso=habilitaciones` con método GET y parámetro `id`.
 */
export const getHabilitacionDetalle = async (id: number): Promise<HabilitacionDetalleType> => {
    const response = await apiClient.get('', { params: { recurso: 'habilitaciones', id } });
    return response.data;
};

/**
 * Crea una nueva habilitación.
 * Corresponde al `recurso=habilitaciones` con método POST.
 */
export const createHabilitacion = async (data: any): Promise<HabilitacionType> => {
    const response = await apiClient.post('', data, { params: { recurso: 'habilitaciones' } });
    return response.data;
};

/**
 * Desvincula una persona de una habilitación.
 * Corresponde al `recurso=personas` con método DELETE.
 * @param idVinculo El ID del registro en la tabla de unión (ej. habilitaciones_personas.id).
 */
export const deletePersona = async (id: number): Promise<void> => {
    await apiClient.delete('', { params: { recurso: 'personas', id } });
};

/**
 * Obtiene la lista de puntos de interés para el mapa.
 * Corresponde al `recurso=puntos_mapa` con método GET.
 */
// =================================================================
// --- SERVICIOS DE GESTIÓN DEL SISTEMA ---
// =================================================================

/**
 * Obtiene la configuración actual del sistema.
 */
export const getSystemConfig = async (): Promise<SystemConfig> => {
    const response = await apiClient.get('', { params: { recurso: 'system_config' } });
    return response.data;
};

/**
 * Actualiza la configuración del sistema.
 */
export const updateSystemConfig = async (config: Partial<SystemConfig>): Promise<SystemConfig> => {
    const response = await apiClient.post('', { ...config }, { params: { recurso: 'system_config' } });
    return response.data;
};

/**
 * Inicia un proceso de copia de seguridad de la base de datos.
 */
export const startSystemBackup = async (): Promise<{ message: string }> => {
    const response = await apiClient.post('', {}, { params: { recurso: 'backup' } });
    return response.data;
};

/**
 * Restablece la base de datos a un estado inicial.
 */
export const resetDatabase = async (): Promise<{ message: string }> => {
    const response = await apiClient.post('', {}, { params: { recurso: 'reset_db' } });
    return response.data;
};

// =================================================================
// --- SERVICIOS DE GESTIÓN DE USUARIOS ---
// =================================================================

/**
 * Obtiene la lista de usuarios administradores.
 */
export const getAdminUsers = async (): Promise<{ success: boolean; data?: AdminUser[]; message?: string; }> => {
    try {
        const response = await apiClient.get('', { params: { recurso: 'admin_users' } });
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

/**
 * Crea un nuevo usuario administrador.
 */
export const createAdminUser = async (userData: Omit<AdminUser, 'id' | 'ultimoAcceso' | 'avatarUrl'>): Promise<{ success: boolean; data?: AdminUser; message?: string; }> => {
    try {
        const response = await apiClient.post('', userData, { params: { recurso: 'admin_users' } });
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

/**
 * Actualiza el estado de un usuario (activo/inactivo).
 */
export const updateUserStatus = async (userId: number, estado: 'activo' | 'inactivo'): Promise<{ success: boolean; message?: string; }> => {
    try {
        await apiClient.put('', { estado }, { params: { recurso: 'admin_users', id: userId } });
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

/**
 * Elimina un usuario administrador.
 */
export const deleteAdminUser = async (userId: number): Promise<{ success: boolean; message?: string; }> => {
    try {
        await apiClient.delete('', { params: { recurso: 'admin_users', id: userId } });
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};


export const getMapPoints = async (): Promise<MapPointType[]> => {
    const response = await apiClient.get('', { params: { recurso: 'puntos_mapa' } });
    return response.data;
};

/*
 * Valida una credencial mediante su código QR.
 * Llama directamente al endpoint validar_qr.php definido en las constantes.
 * @param qrToken El token extraído del código QR.
 * @returns Una promesa que resuelve con la respuesta de la API.
 */
// export const validateCredential = async (qrToken: string): Promise<QRValidationResponse> => {
//     console.log(`[API Service] Validando QR con token: ${qrToken}`);
    
//     try {
//         const response = await axios.post(ENDPOINT_VALIDAR_QR, { qr_data: qrToken });
        
//         if (response.data && response.status === 200) {
//             return response.data;
//         } else {
//             // Esto puede ocurrir si la respuesta es 200 pero el contenido no es el esperado
//             return {
//                 success: false,
//                 message: 'Respuesta inesperada del servidor.'
//             };
//         }
//     } catch (error) {
//         if (axios.isAxiosError(error)) {
//             // Error de red o error HTTP devuelto por el servidor (ej. 4xx, 5xx)
//             const errorMsg = error.response?.data?.message || 'Error de comunicación con el servidor.';
//             console.error(`[API Service] Error al validar QR: ${errorMsg}`);
//             return {
//                 success: false,
//                 message: errorMsg
//             };
//         } else {
//             // Error inesperado (ej. de programación)
//             console.error('[API Service] Error inesperado:', error);
//             return {
//                 success: false,
//                 message: 'Ocurrió un error inesperado.'
//             };
//         }
//     }
// };