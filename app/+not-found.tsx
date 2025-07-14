// app/+not-found.tsx

/// <reference types="expo-router/types" />

import { Link, Stack } from 'expo-router';
import React, { useEffect, useRef } from 'react';
// CORRECCIÓN: Se añade 'TouchableOpacity' a la importación.
import { Animated, Easing, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// --- Ícono SVG Animado ---
const SadRobotIcon = ({ animatedValue }: { animatedValue: Animated.Value }) => {
  const rotate = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-5deg', '5deg', '-5deg'],
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -10, 0],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }, { translateY }] }}>
      <Svg width={120} height={120} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2a4 4 0 00-4 4h8a4 4 0 00-4-4z" stroke="#9CA3AF" strokeWidth={1.5} />
        <Path d="M8 6h8v10a2 2 0 01-2 2H10a2 2 0 01-2-2V6z" stroke="#9CA3AF" strokeWidth={1.5} />
        <Path d="M9 14c.5 1 1.5 1 2 0" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M15 11H9" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M17 18l-1-3M7 18l1-3" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
};

export default function NotFoundScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de balanceo para el ícono
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(iconAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Animación de entrada para el texto
    Animated.stagger(200, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 10,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!', headerBackVisible: false }} />
      <SafeAreaView style={styles.container}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.content}>
            <SadRobotIcon animatedValue={iconAnim} />
            <Text style={styles.title}>Página no encontrada</Text>
            <Text style={styles.subtitle}>
              La pantalla que buscas no existe o fue movida.
            </Text>

            <Link href="/" asChild>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Volver al Inicio</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </Animated.View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB', // Un fondo gris claro
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937', // Un color de texto oscuro
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280', // Un gris más suave para el subtítulo
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 300,
  },
  button: {
    marginTop: 40,
    backgroundColor: '#0093D2', // Usando el color primario de la app
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 99, // Botón completamente redondeado
    shadowColor: '#0093D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
