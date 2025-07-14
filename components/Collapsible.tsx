// =================================================================
// src/contexts/AuthContext.tsx - v3.0 (Versión Final Tipada)
// =================================================================
// Gestiona el estado de autenticación, la sesión persistente y
// la comunicación con la API para el login.
// =================================================================

import { API_MANUAL_LOGIN_URL, API_QR_LOGIN_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

// --- 1. Definición de Tipos ---

// Describe la forma del objeto de sesión del usuario
interface UserSession {
  dni: string;
  nombre: string;
  token: string;
  // Puedes añadir más propiedades aquí si tu API las devuelve
}

// Describe todo lo que nuestro contexto va a proveer
interface AuthContextType {
  userSession: UserSession | null;
  isLoading: boolean;
  isSessionLoading: boolean;
  error: string;
  signInWithQR: (qrData: string) => Promise<void>;
  signInWithManual: (licencia: string, dni: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// --- 2. Creación del Contexto ---

// Se crea el contexto con un valor por defecto que coincide con el tipo.
// Esto ayuda a TypeScript y evita errores de 'null'.
export const AuthContext = createContext<AuthContextType>({
  userSession: null,
  isLoading: false,
  isSessionLoading: true,
  error: '',
  signInWithQR: async () => {},
  signInWithManual: async () => {},
  signOut: async () => {},
});

// --- 3. Hook Personalizado (Custom Hook) ---

// La forma recomendada de usar este contexto en otros componentes.
export const useAuth = () => {
  return useContext(AuthContext);
};

// --- 4. Utilidad de Timeout ---
const fetchWithTimeout = (url: string, options: RequestInit, timeout = 15000): Promise<Response> => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo de espera agotado. Verifique la conexión.')), timeout)
    )
  ]);
};

// --- 5. Componente Provider ---

// Este componente envuelve la aplicación y provee el estado y las funciones.
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Carga la sesión guardada al iniciar la app
  useEffect(() => {
    const checkStoredSession = async () => {
      try {
        const storedSession = await AsyncStorage.getItem('userSession');
        if (storedSession) {
          setUserSession(JSON.parse(storedSession));
        }
      } catch (e) {
        console.error("Fallo al cargar la sesión del almacenamiento.", e);
      } finally {
        setIsSessionLoading(false);
      }
    };
    checkStoredSession();
  }, []);

  // Maneja una respuesta de login exitosa
  const handleLoginSuccess = async (data: UserSession) => {
    try {
      await AsyncStorage.setItem('userSession', JSON.stringify(data));
      setUserSession(data);
      setError('');
    } catch (e) {
      console.error("Fallo al guardar la sesión.", e);
      handleLoginError("No se pudo guardar la sesión de usuario.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Maneja errores de login
  const handleLoginError = (errorMessage: string) => {
    setError(errorMessage || 'Ocurrió un error inesperado.');
    setIsLoading(false);
  };

  // Login con QR
  const signInWithQR = async (qrData: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetchWithTimeout(API_QR_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ qrToken: qrData }),
      });
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        await handleLoginSuccess(result.data);
      } else {
        throw new Error(result.message || 'El código QR no es válido o ha expirado.');
      }
    } catch (e: any) {
      handleLoginError(e.message);
    }
  };

  // Login Manual
  const signInWithManual = async (licencia: string, dni: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetchWithTimeout(API_MANUAL_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ licencia, dni }),
      });
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        await handleLoginSuccess(result.data);
      } else {
        throw new Error(result.message || 'Los datos ingresados son incorrectos.');
      }
    } catch (e: any) {
      handleLoginError(e.message);
    }
  };

  // Cerrar sesión
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('userSession');
      setUserSession(null);
      setError('');
    } catch (e) {
      console.error("Fallo al limpiar la sesión del almacenamiento.", e);
      setError("Error al cerrar la sesión.");
    }
  };

  // El valor que será accesible por todos los componentes hijos
  const value = {
    userSession,
    isLoading,
    isSessionLoading,
    error,
    signInWithQR,
    signInWithManual,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};