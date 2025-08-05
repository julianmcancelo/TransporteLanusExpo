// =================================================================
// src/contexts/AuthContext.tsx - v5.5 (con signInWithQR añadido)
// Gestiona la sesión para múltiples roles y protege las rutas.
// =================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
// ================== INICIO DE ADICIÓN PARA QR ==================
// 1. Se añade la URL para el login con QR
import { API_INTERNAL_LOGIN_URL, API_MANUAL_LOGIN_URL, API_QR_LOGIN_URL } from '../constants/api';
// =================== FIN DE ADICIÓN PARA QR ===================

// --- Definición de Tipos ---
interface ContribuyenteSession {
    rol: 'contribuyente';
    dni: string;
    nombre: string;
    token: string;
    avatarUrl?: string;
}

export interface InternalUserSession {
    rol: 'admin' | 'inspector';
    email: string;
    nombre: string;
    legajo: string | null;
    token: string;
    avatarUrl?: string;
}

export type UserSession = ContribuyenteSession | InternalUserSession | null;

interface AuthContextType {
    userSession: UserSession;
    isLoading: boolean;
    isSessionLoading: boolean;
    error: string;
    signInWithQR: (qrData: string) => Promise<void>;
    signInWithManual: (licencia: string, dni: string) => Promise<void>;
    signInWithInternal: (identifier: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    // setPendingCount removed - not used in the application
}

export const AuthContext = createContext<AuthContextType>({
    userSession: null,
    isLoading: false,
    isSessionLoading: true,
    error: '',
    signInWithQR: async () => {},
    signInWithManual: async () => {},
    signInWithInternal: async () => {},
    signOut: async () => {},
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

const fetchWithTimeout = (url: string, options: RequestInit, timeout = 15000): Promise<Response> => {
    return Promise.race([
        fetch(url, options),
        new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Tiempo de espera agotado. Verifique la conexión.')), timeout)
        )
    ]);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [userSession, setUserSession] = useState<UserSession>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSessionLoading, setIsSessionLoading] = useState(true);
    // We'll implement this in the future for notification badges
    // const [pendingCount, setPendingCount] = useState(0);

    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const checkStoredSession = async () => {
            try {
                const storedSession = await AsyncStorage.getItem('userSession');
                if (storedSession) {
                    const sessionData = JSON.parse(storedSession);
                    
                    // Ensure the session has an avatarUrl
                    if (!sessionData.avatarUrl && sessionData.rol) {
                        sessionData.avatarUrl = getDefaultAvatarUrl(sessionData.rol);
                    }
                    
                    setUserSession(sessionData);
                }
            } catch (e) {
                console.error("Fallo al cargar la sesión.", e);
            } finally {
                setIsSessionLoading(false);
            }
        };
        checkStoredSession();
    }, []);

    useEffect(() => {
        if (isSessionLoading) return;
        const inAuthGroup = (segments as string[]).includes('login');

        if (userSession && inAuthGroup) {
            switch (userSession.rol) {
                case 'contribuyente':
                    router.replace('/(contribuyente)/home');
                    break;
                case 'admin':
                    router.replace('/(admin)/dashboard');
                    break;
                case 'inspector':
                    router.replace('/(inspector)/inspecciones');
                    break;
            }
        } else if (!userSession && !inAuthGroup) {
            router.replace('/login');
        }
    }, [userSession, isSessionLoading, segments, router]);

    const handleLoginSuccess = async (data: ContribuyenteSession | InternalUserSession) => {
        try {
            // Add default avatar URL based on role if not provided
            const enhancedData = {
                ...data,
                avatarUrl: data.avatarUrl || getDefaultAvatarUrl(data.rol)
            };
            
            await AsyncStorage.setItem('userSession', JSON.stringify(enhancedData));
            setUserSession(enhancedData);
            setError('');
        } catch (e) {
            console.error("Fallo al guardar la sesión.", e);
            handleLoginError("No se pudo guardar la sesión de usuario.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const getDefaultAvatarUrl = (role: string) => {
        // Return a default avatar URL based on user role
        switch(role) {
            case 'admin':
                return 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff';
            case 'inspector':
                return 'https://ui-avatars.com/api/?name=Inspector&background=22C55E&color=fff';
            case 'contribuyente':
                return 'https://ui-avatars.com/api/?name=Usuario&background=6366F1&color=fff';
            default:
                return 'https://ui-avatars.com/api/?name=User&background=64748B&color=fff';
        }
    };

    const handleLoginError = (errorMessage: string) => {
        setError(errorMessage || 'Ocurrió un error inesperado.');
        setIsLoading(false);
    };

    const signOut = async () => {
        try {
            await AsyncStorage.removeItem('userSession');
            setUserSession(null);
            setError('');
        } catch (e) {
            console.error("Fallo al limpiar la sesión.", e);
            setError("Error al cerrar la sesión.");
        }
    };

    // ================== INICIO DE ADICIÓN PARA QR ==================
    // 2. Se implementa la lógica completa de signInWithQR
    const signInWithQR = async (qrData: string) => {
        if (isLoading) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetchWithTimeout(API_QR_LOGIN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ qr_token: qrData }),
            });

            const result = await response.json();
            if (response.ok && result.status === 'success') {
                // Asumimos que el login por QR es para contribuyentes y devuelve los mismos datos
                const sessionData: ContribuyenteSession = { ...result.data, rol: 'contribuyente' };
                await handleLoginSuccess(sessionData);
            } else {
                throw new Error(result.message || 'El código QR no es válido o ha expirado.');
            }
        } catch (e: any) {
            handleLoginError(e.message);
        }
    };
    // =================== FIN DE ADICIÓN PARA QR ===================

    const signInWithManual = async (licencia: string, dni: string) => {
        if (isLoading) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetchWithTimeout(API_MANUAL_LOGIN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ licencia, dni }),
            });

            const result = await response.json();
            if (response.ok && result.status === 'success') {
                const sessionData: ContribuyenteSession = { ...result.data, rol: 'contribuyente' };
                await handleLoginSuccess(sessionData);
            } else {
                throw new Error(result.message || 'Los datos ingresados son incorrectos.');
            }
        } catch (e: any) {
            handleLoginError(e.message);
        }
    };

    const signInWithInternal = async (identifier: string, password: string) => {
        if (isLoading) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetchWithTimeout(API_INTERNAL_LOGIN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ identifier, password }),
            });

            const result = await response.json();
            if (response.ok && result.status === 'success') {
                const potentialSession = result.data as InternalUserSession;
                if (potentialSession.rol === 'admin' || potentialSession.rol === 'inspector') {
                    await handleLoginSuccess(potentialSession);
                } else {
                    throw new Error('Acceso no autorizado para este tipo de usuario.');
                }
            } else {
                throw new Error(result.message || 'Credenciales o rol incorrectos.');
            }
        } catch (e: any) {
            handleLoginError(e.message);
        }
    };

    const value: AuthContextType = {
        userSession,
        isLoading,
        isSessionLoading,
        error,
        signInWithQR,
        signInWithManual,
        signInWithInternal,
        signOut,
        // setPendingCount removed - not implemented/used
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};