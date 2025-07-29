// src/types/habilitacion.ts

// --- Entidades Principales ---

export interface Persona {
    id: number;
    nombre: string;
    dni?: string;
    rol: 'TITULAR' | 'CHOFER' | 'CELADOR';
  }
  
  export interface Vehiculo {
    id: number;
    dominio: string;
    marca?: string;
    modelo?: string;
    ano?: string;
    motor?: string;
    asientos?: number;
    inscripcion_inicial?: string;
    Vencimiento_VTV?: string;
    Vencimiento_Poliza?: string;
    chasis?: string;
  }
  
  export interface Establecimiento {
    id: number;
    nombre: string;
    tipo: 'remiseria' | 'establecimiento';
  }
  
  // ✅ NUEVA INTERFAZ PARA LOS PUNTOS DEL MAPA
  export interface MapPoint {
    id: number;
    nombre: string;
    latitud: string;
    longitud: string;
    total_licencias: number;
    tipo: 'educacion' | 'remises';
  }
  
  
  // --- Entidades de Historiales ---
  
  export interface Turno {
      id: number;
      fecha: string;
      hora: string;
      estado: 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'ANULADO';
  }
  
  export interface Oblea {
      id: number;
      fecha_colocacion: string;
      titular: string;
  }
  
  export interface Inspeccion {
      id: number;
      fecha_inspeccion: string;
      nombre_inspector: string;
      resultado_final: 'APROBADO' | 'RECHAZADO' | 'CONDICIONAL';
  }
  
  
  // --- Interfaces Compuestas ---
  
  /**
   * Representa los datos básicos de una habilitación para la vista de lista.
   */
  export interface Habilitacion {
    habilitacion_id: number;
    nro_licencia: string;
    resolucion: string | null;
    estado: 'HABILITADO' | 'NO HABILITADO' | 'EN TRAMITE' | 'INICIADO';
    vigencia_inicio: string; // Formato 'YYYY-MM-DD'
    vigencia_fin: string; // Formato 'YYYY-MM-DD'
    tipo_transporte: 'Escolar' | 'Remis' | 'Demo';
    tipo: 'Escolar' | 'Remis'; 
    expte: string | null;
    observaciones: string | null;
    titular_principal: string | null;
    personas: Persona[];
    vehiculos: Vehiculo[];
    establecimientos: Establecimiento[];
  }
  
  /**
   * Representa todos los datos de una habilitación para la vista de detalle.
   */
  export interface HabilitacionDetalle extends Omit<Habilitacion, 'vehiculos'> {
      vehiculo: Vehiculo | null;
      historial_inspecciones: Inspeccion[];
      historial_obleas: Oblea[];
      historial_turnos: Turno[];
  }
  
  /**
   * Estructura de datos para crear una nueva habilitación.
   */
  export type HabilitacionPayload = Omit<Habilitacion, 'habilitacion_id' | 'personas' | 'vehiculos' | 'establecimientos' | 'titular_principal'>;