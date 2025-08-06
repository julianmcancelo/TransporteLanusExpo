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
}

interface InternalUserSession {
    rol: 'admin' | 'inspector';
    email: string;
    nombre: string;
    legajo: string | null;
    token: string;
}

export type User = ContribuyenteSession | InternalUserSession | null;

interface AuthContextType {
    session: User;
    isLoading: boolean;
    isSessionLoading: boolean;
    error: string;
    signInWithQR: (qrData: string) => Promise<void>;
    signInWithManual: (licencia: string, dni: string) => Promise<void>;
    signInWithInternal: (identifier: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    setPendingCount: (count: number) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    const [session, setSession] = useState<User>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSessionLoading, setIsSessionLoading] = useState(true);
    const [, setPendingCount] = useState(0);

    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const checkStoredSession = async () => {
            try {
                const storedSession = await AsyncStorage.getItem('session');
                if (storedSession) {
                    setSession(JSON.parse(storedSession));
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

        if (session && inAuthGroup) {
            switch (session.rol) {
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
        } else if (!session && !inAuthGroup) {
            router.replace('/login');
        }
    }, [session, isSessionLoading, segments, router]);

    const handleLoginSuccess = async (data: ContribuyenteSession | InternalUserSession) => {
        try {
            await AsyncStorage.setItem('session', JSON.stringify(data));
            setSession(data);
            setError('');
        } catch (e) {
            console.error("Fallo al guardar la sesión.", e);
            setError("Error al guardar la sesión.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginError = (errorMessage: string) => {
        setError(errorMessage || 'Ocurrió un error inesperado.');
        setIsLoading(false);
    };

    const signOut = async () => {
        setSession(null);
        await AsyncStorage.removeItem('session');
        router.replace('/login');
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
        session,
        isLoading,
        isSessionLoading,
        error,
        signInWithQR,
        signInWithManual,
        signInWithInternal,
        signOut,
        setPendingCount,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};