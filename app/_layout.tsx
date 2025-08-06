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
import { CustomThemeProvider, useTheme } from '../src/contexts/ThemeContext';

const queryClient = new QueryClient();

// Mantiene visible la pantalla de bienvenida nativa mientras cargamos los recursos
SplashScreen.preventAutoHideAsync();

// NOTA: Para eliminar completamente el logo de Expo, es necesario crear una build de desarrollo o producción
// El logo de Expo solo aparece cuando se ejecuta la app dentro de Expo Go
// Para crear una build de desarrollo: npx expo prebuild
// Para crear una build de producción: eas build --platform android (o ios)

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
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [isMinTimePassed, setIsMinTimePassed] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsAuthLoaded(true);
    }
  }, [isLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMinTimePassed(true);
    }, 2000); // 2 segundos de splash screen
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isAuthLoaded || !isMinTimePassed) {
      return;
    }

    const inApp = segments[0] === '(admin)' || segments[0] === '(inspector)' || segments[0] === '(contribuyente)';

    if (session && !inApp) {
      let targetDashboard = '/login'; // Ruta por defecto
      if (session.rol === 'admin') {
        targetDashboard = '/(admin)/dashboard';
      } else if (session.rol === 'inspector') {
        targetDashboard = '/(inspector)/inspecciones';
      } else if (session.rol === 'contribuyente') {
        targetDashboard = '/(contribuyente)/home';
      } else if (session.rol === 'master') {
        targetDashboard = '/(master)/dashboard';
      }
      router.replace(targetDashboard as any);
    } else if (!session && inApp) {
      router.replace('/login' as any);
    }
  }, [isAuthLoaded, isMinTimePassed, session, segments, router]);

  if (!isAuthLoaded || !isMinTimePassed) {
    return <CustomSplashScreen />;
  }

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
    // 'Inter-Bold': require('../assets/fonts/Inter-Bold.otf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (loaded || error) {
      await SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <CustomThemeProvider>
            <ThemedApp />
          </CustomThemeProvider>
        </QueryClientProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function ThemedApp() {
  const { theme, isDarkTheme } = useTheme();

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
      <RootLayoutNav />
    </PaperProvider>
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