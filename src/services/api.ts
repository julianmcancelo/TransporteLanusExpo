// src/services/api.ts
import axios from 'axios';
import { Habilitacion, HabilitacionDetalle, HabilitacionPayload, MapPoint } from '../types/habilitacion';

// Configura la URL base de tu API, apuntando directamente al archivo .php
const apiClient = axios.create({
  baseURL: 'https://api.transportelanus.com.ar/admin/api.php',
  headers: {
    'Content-Type': 'application/json',
    // Aquí podrías añadir un token de autenticación si lo necesitas
    // 'Authorization': `Bearer TU_TOKEN`
  },
});

// Parámetros para filtrar la búsqueda de habilitaciones
export interface GetHabilitacionesParams {
  tipo: 'Escolar' | 'Remis' | 'Demo';
  ordenar?: string;
  buscar?: string;
}

/**
 * Obtiene la lista de habilitaciones.
 */
export const getHabilitaciones = async (params: GetHabilitacionesParams): Promise<Habilitacion[]> => {
  const response = await apiClient.get('', { 
    params: { recurso: 'habilitaciones', ...params } 
  });
  return response.data;
};

/**
 * ✅ FUNCIÓN AÑADIDA
 * Obtiene el detalle completo de una única habilitación por su ID.
 */
export const getHabilitacionDetalle = async (id: number): Promise<HabilitacionDetalle> => {
    console.log(`[API Service] Pidiendo detalle para el ID: ${id}`);
    try {
      const response = await apiClient.get('', { 
        params: { recurso: 'habilitaciones', id: id } 
      });
      // ✅ AÑADE ESTE LOG:
      console.log('[API Service] Respuesta recibida del servidor:', response.data);
      return response.data;
    } catch (error) {
      // ✅ AÑADE ESTE LOG:
      console.error('[API Service] Error en la llamada de Axios:', error);
      throw error; // Re-lanza el error para que React Query lo capture
    }
  };

/**
 * Desvincula una persona de una habilitación.
 */
export const deletePersona = async (id: number): Promise<void> => {
  await apiClient.delete('', { 
    params: { recurso: 'personas', id: id } 
  });
};


// ✅ AÑADIR ESTA NUEVA FUNCIÓN
export const getMapPoints = async (): Promise<MapPoint[]> => {
    const response = await apiClient.get('', { 
      params: { recurso: 'puntos_mapa' } 
    });
    return response.data;
  };

/**
 * Crea una nueva habilitación.
 * (Requiere implementación en api.php para el método POST)
 */
export const createHabilitacion = async (data: HabilitacionPayload): Promise<Habilitacion> => {
  const response = await apiClient.post('', data, { 
    params: { recurso: 'habilitaciones' }
  });
  return response.data;
};