import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Title } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';

export default function MapaWebScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Mapa' }} />
      <View style={styles.container}>
        <Feather name="map-pin" size={48} color="#94a3b8" />
        <Title style={styles.title}>Mapa no disponible en la web</Title>
        <Text style={styles.subtitle}>
          Esta función solo está disponible en la aplicación móvil.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  title: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#334155',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 300,
  },
});