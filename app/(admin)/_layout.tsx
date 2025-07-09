// app/(admin)/_layout.tsx

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
        headerRight: () => (
          <Pressable onPress={signOut} style={{ marginRight: 15 }}>
            <FontAwesome name="sign-out" size={25} color="gray" />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <FontAwesome name="tachometer" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}