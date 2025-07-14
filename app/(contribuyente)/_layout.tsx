// app/(contribuyente)/_layout.tsx
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

export default function ContribuyenteLayout() {
  const { signOut } = useAuth();

  return (
    <Stack
      screenOptions={{
        // Se mantiene el botón de cerrar sesión para las pantallas que sí muestren la cabecera
        headerRight: () => (
          <Pressable onPress={signOut} style={{ marginRight: 15 }}>
            <FontAwesome name="sign-out" size={25} color="gray" />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen
        name="home" // Coincide con el archivo home.tsx
        options={{
          // Oculta la barra de arriba (cabecera) completamente para la pantalla de inicio
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="appointments" // Coincide con el archivo appointments.tsx
        options={{
          // Muestra la cabecera con el título para la pantalla de turnos
          title: "Mis Turnos",
        }}
      />
      {/* Puedes añadir más pantallas a la navegación aquí en el futuro */}
    </Stack>
  );
}
