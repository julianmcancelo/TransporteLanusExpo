import '../global.js'; // 

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { userSession, isLoading } = useAuth();
    const segments = useSegments();

    useEffect(() => {
        if (isLoading) return;

        const inApp = segments[0] === '(admin)' || segments[0] === '(inspector)' || segments[0] === '(contribuyente)';

        if (userSession && !inApp) {
            let targetDashboard = '/login'; // Ruta por defecto si el rol no coincide
            if (userSession.rol === 'admin') {
                targetDashboard = '/(admin)/dashboard';
            } else if (userSession.rol === 'inspector') {
                targetDashboard = '/(inspector)/inspecciones';
            } else if (userSession.rol === 'contribuyente') {
                // Asumiendo que el dashboard del contribuyente está en esta ruta
                targetDashboard = '/(contribuyente)/dashboard';
            }
            router.replace(targetDashboard as any);
        } else if (!userSession && inApp) {
            router.replace('/login');
        }
    }, [userSession, isLoading, segments]);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="credential" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="(inspector)" />
            <Stack.Screen name="(contribuyente)" />
        </Stack>
    );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Carga de fuentes
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
            <QueryClientProvider client={queryClient}>
                <PaperProvider>
                    <RootLayoutNav />
                </PaperProvider>
            </QueryClientProvider>
        </AuthProvider>
    </GestureHandlerRootView>
  );
}