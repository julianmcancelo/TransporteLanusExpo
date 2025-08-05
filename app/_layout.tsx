import '../global.js';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

const queryClient = new QueryClient();

// Mantiene visible la pantalla de bienvenida nativa mientras cargamos los recursos
SplashScreen.preventAutoHideAsync();

// --- COMPONENTE DE SPLASH SCREEN CON ESTÉTICA MEJORADA ---
function CustomSplashScreen() {
  // Valores animados para escala, opacidad y posición
  const logoScale = useMemo(() => new Animated.Value(0.9), []);
  const logoOpacity = useMemo(() => new Animated.Value(0), []);
  const textTranslateY = useMemo(() => new Animated.Value(20), []);
  const textOpacity = useMemo(() => new Animated.Value(0), []);

  // Animación de entrada al montar el componente
  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoOpacity, logoScale, textOpacity, textTranslateY]);

  return (
    <View style={styles.splashContainer}>
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={{ uri: 'https://api.transportelanus.com.ar/logo2.png' }}
          style={styles.splashImage}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslateY }] }}>
        <Text style={styles.splashText}>Municipalidad de Lanús</Text>
        <Text style={styles.versionText}>v1.0.3</Text>
      </Animated.View>
    </View>
  );
}

// --- LÓGICA DE NAVEGACIÓN CON 3 SEGUNDOS DE DURACIÓN MÍNIMA ---
function RootLayoutNav() {
  const { userSession, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Estados para controlar las dos condiciones: carga de datos y tiempo mínimo
  const [isAuthLoaded, setAuthLoaded] = useState(false);
  const [isMinTimePassed, setMinTimePassed] = useState(false);

  // 1. Efecto para el temporizador de 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 3000); // 3000 milisegundos = 3 segundos

    // Limpia el temporizador si el componente se desmonta antes de tiempo
    return () => clearTimeout(timer);
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez

  // 2. Efecto para monitorear la carga de la autenticación
  useEffect(() => {
    if (!isLoading) {
      setAuthLoaded(true);
    }
  }, [isLoading]);

  // Efecto para la redirección: se ejecuta solo cuando el splash ha terminado
  useEffect(() => {
    // No hacer nada si todavía estamos mostrando el splash
    if (!isAuthLoaded || !isMinTimePassed) {
      return;
    }

    const inApp = segments[0] === '(admin)' || segments[0] === '(inspector)' || segments[0] === '(contribuyente)';

    if (userSession && !inApp) {
      let targetDashboard = '/login'; // Ruta por defecto
      if (userSession.rol === 'admin') {
        targetDashboard = '/(admin)/dashboard';
      } else if (userSession.rol === 'inspector') {
        targetDashboard = '/(inspector)/inspecciones';
      } else if (userSession.rol === 'contribuyente') {
        targetDashboard = '/(contribuyente)/dashboard';
      } else if (userSession.rol === 'master') {
        targetDashboard = '/(master)/dashboard';
      }
      router.replace(targetDashboard as any);
    } else if (!userSession && inApp) {
      router.replace('/login' as any);
    }
  }, [isAuthLoaded, isMinTimePassed, userSession, segments, router]);

  // Mostrar el splash hasta que AMBAS condiciones (tiempo y carga) se cumplan
  if (!isAuthLoaded || !isMinTimePassed) {
    return <CustomSplashScreen />;
  }

  // Cuando ambas condiciones son verdaderas, mostrar la app
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

// --- COMPONENTE RAÍZ PRINCIPAL ---
export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Aquí puedes añadir tus fuentes personalizadas si las tienes
    // 'Inter-Bold': require('../assets/fonts/Inter-Bold.otf'),
  });

  // Oculta la pantalla de bienvenida nativa una vez que las fuentes están cargadas.
  const onLayoutRootView = useCallback(async () => {
    if (loaded || error) {
      await SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // No renderizar nada hasta que las fuentes estén listas
  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <StatusBar style="light" />
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

// --- ESTILOS PARA EL SPLASH SCREEN ---
const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#0277BD', // Un azul corporativo más vivo
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  splashText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF', // Texto blanco para alto contraste
    textAlign: 'center',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#BDBDBD', // Un gris claro para el texto de versión
    textAlign: 'center',
  },
});