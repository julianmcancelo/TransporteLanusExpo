import { Tabs } from 'expo-router';
import React from 'react';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="statistics" options={{ title: 'Statistics' }} />
      <Tabs.Screen name="[id]" options={{ href: null }} />
    </Tabs>
  );
}