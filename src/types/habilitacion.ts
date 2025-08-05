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

  // --- Interfaces para el Formulario de Inspección ---

  /**
   * Define la estructura de los datos de localización para una foto.
   */
  export interface LocationData {
    latitude: number;
    longitude: number;
    timestamp: number;
  }

  /**
   * Representa una foto tomada durante la inspección.
   */
  export interface Photo {
    uri: string;
    base64?: string; // Para el envío a la API
    location: LocationData | null;
    item_id: string; // ID del ítem de inspección asociado
  }

  /**
   * Representa un único ítem a verificar en la inspección.
   */
  export interface InspectionItem {
    id: string;
    category: string;
    description: string;
    state: 'OK' | 'NO' | 'NA';
    observation: string;
  }

  /**
   * Representa el trámite de inspección que se pasa entre pantallas.
   */
  export interface Tramite {
    id: number;
    nro_licencia: string;
    nombre_titular: string;
    dominio: string;
    tipo_inspeccion: 'escolar' | 'remis' | 'taxi';
    items: InspectionItem[];
  }