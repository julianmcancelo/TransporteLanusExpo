// =================================================================
// ARCHIVO: src/services/api.ts (v7.0 - Versión de Producción)
//
// Propósito: Centraliza toda la comunicación con la API del backend.
// Este archivo actúa como una capa de servicio que la aplicación
// utiliza para obtener y enviar datos.
// =================================================================

import axios, { AxiosError } from 'axios';
import { Habilitacion as HabilitacionType, HabilitacionDetalle as HabilitacionDetalleType, MapPoint as MapPointType } from '../types/habilitacion';
import { ENDPOINT_VALIDAR_QR } from '../constants/api';

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
export const getMapPoints = async (): Promise<MapPointType[]> => {
    const response = await apiClient.get('', { params: { recurso: 'puntos_mapa' } });
    return response.data;
};

/**
 * Valida una credencial mediante su código QR.
 * Llama directamente al endpoint validar_qr.php definido en las constantes.
 * @param qrToken El token extraído del código QR.
 * @returns Un objeto con success, message y datos de la credencial
 */
export const validateCredential = async (qrToken: string): Promise<QRValidationResponse> => {
    console.log(`[API Service] Validando QR con token: ${qrToken}`);
    
    try {
        // Llamada directa al endpoint de validación de QR
        const response = await axios.post(
            ENDPOINT_VALIDAR_QR,
            { qr_token: qrToken },
            {
                headers: {
                    'Content-Type': 'application/json',
                    // El token de autorización se añadirá automáticamente si está configurado
                    // mediante el interceptor de solicitudes
                }
            }
        );
        
        // La respuesta ya viene en formato de éxito
        if (response.data && response.status === 200) {
            return {
                success: true,
                data: response.data,
                message: 'Credencial validada correctamente'
            };
        } else {
            return {
                success: false,
                message: 'Formato de respuesta inválido'
            };
        }
    } catch (error: any) {
        // Si hay un error en la llamada, capturamos el mensaje del servidor
        const errorMsg = error.response?.data?.message || 'Error al validar QR';
        console.error(`[API Service] Error al validar QR: ${errorMsg}`);
        
        return {
            success: false,
            message: errorMsg
        };
    }
};