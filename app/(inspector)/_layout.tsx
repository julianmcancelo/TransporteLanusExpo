// app/(inspector)/_layout.tsx
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

export default function InspectorLayout() {
  const { signOut } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerRight: () => (
          <Pressable onPress={signOut} style={{ marginRight: 15 }}>
            <FontAwesome name="sign-out" size={25} color="gray" />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="inspecciones" // Coincide con el archivo inspecciones.tsx
        options={{
          title: 'Panel de Inspector',
          headerShown: false, 
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="historial" // Archivo: app/(inspector)/historial.tsx
        options={{
          title: 'Historial',
          headerShown: true, 
          tabBarIcon: ({ color }) => <FontAwesome name="history" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}