// app/(inspector)/_layout.tsx
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

export default function InspectorLayout() {
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerRight: () => (
          <Pressable onPress={signOut} style={{ marginRight: 15 }}>
            <FontAwesome name="sign-out" size={25} color="gray" />
          </Pressable>
        ),
      }}
    >
      {/* 1. Pantalla principal, se mantiene igual */}
      <Stack.Screen
        name="inspecciones" 
        options={{ headerShown: false }}
      />

      {/* 2. Pantallas que son archivos directos en la carpeta (inspector) */}
      <Stack.Screen
        name="inspection-form"
        options={{
          title: '',
          headerLeft: () => (
             <Pressable onPress={() => router.back()} style={{ marginLeft: 15 }}>
              <FontAwesome name="chevron-left" size={25} color="gray" />
            </Pressable>
          )
        }}
      />
      <Stack.Screen
        name="seleccionar-tramite"
        options={{
          title: '',
          headerLeft: () => (
             <Pressable onPress={() => router.back()} style={{ marginLeft: 15 }}>
              <FontAwesome name="chevron-left" size={25} color="gray" />
            </Pressable>
          )
        }}
      />
      {/* Agrega aquí otras pantallas que sean archivos, como "nueva-inspeccion.tsx" si existe */}
      {/* <Stack.Screen name="nueva-inspeccion" options={{ title: '' }} /> */}


      {/* 3. Referencia al grupo de rutas 'historial' */}
      {/* No se configuran detalles aquí, solo se le dice al Stack que existe. */}
      {/* Su propia cabecera se manejará en 'app/(inspector)/historial/_layout.tsx' */}
      <Stack.Screen 
        name="historial" 
        options={{ headerShown: false }} 
      />

    </Stack>
  );
}
