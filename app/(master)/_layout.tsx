import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MasterLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#E63946',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
          paddingTop: 5,
          paddingBottom: 5,
        },
      }}
    >
      <Tabs.Screen 
        name="dashboard" 
        options={{ 
          title: 'Master Control', 
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="security" size={24} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="system" 
        options={{ 
          title: 'Sistema',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog" size={24} color={color} />
          ),
        }} 
      />
      {/* Removed extraneous [id] route that was causing warnings */}
    </Tabs>
  );
}
