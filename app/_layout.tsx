// app/_layout.tsx
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider } from '../src/contexts/AuthContext';

// Prevenir que la pantalla de splash se oculte automáticamente
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Aquí puedes cargar fuentes si las usas en el futuro
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null; // Muestra la pantalla de splash mientras cargan las fuentes
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(contribuyente)" /> 
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(inspector)" />
      </Stack>
    </AuthProvider>
  );
}