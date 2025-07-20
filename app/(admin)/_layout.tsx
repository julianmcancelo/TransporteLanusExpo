import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AdminLayout() {
  const { signOut } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#64748b',
        headerRight: () => (
          <Pressable onPress={signOut} style={{ marginRight: 15 }}>
            {({ pressed }) => (
              <FontAwesome
                name="sign-out"
                size={25}
                color="#64748b"
                style={{ opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Panel',
          tabBarIcon: ({ color, size }) => <FontAwesome name="tachometer" size={size} color={color} />,
        }}
      />

      {/* ✅ PESTAÑA AÑADIDA PARA EL MAPA */}
      <Tabs.Screen
        name="mapa" // Deberás crear un archivo mapa.tsx para esta pantalla
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <FontAwesome name="map" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="mapa-web"
        options={{
          title: 'Mapa Web',
          tabBarIcon: ({ color, size }) => <FontAwesome name="globe" size={size} color={color} />,
        }}
      />
      
      {/* Esta pantalla no aparecerá en las pestañas, pero es parte de la navegación */}
      <Tabs.Screen
        name="[id]"
        options={{
            href: null, // Oculta esta ruta de la barra de pestañas
            title: 'Detalle de Habilitación'
        }}
      />
    </Tabs>
  );
}