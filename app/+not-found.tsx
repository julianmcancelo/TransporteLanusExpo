// app/+not-found.tsx

import { LinearGradient } from 'expo-linear-gradient';
import { Link, Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

// --- Ícono SVG Animado ---
const SadRobotIcon = () => {
  const float = useSharedValue(0);
  const blink = useSharedValue(1);

  useEffect(() => {
    // Animación de flotar y balancearse
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Animación de parpadeo para el "ojo"
    blink.value = withRepeat(
      withSequence(
        withDelay(2000, withTiming(0, { duration: 100 })),
        withTiming(1, { duration: 100 }),
        withDelay(3000, withTiming(0, { duration: 100 })),
        withTiming(1, { duration: 100 })
      ),
      -1,
      false
    );
  }, [float, blink]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(float.value, [0, 1], [0, -20]);
    const rotate = interpolate(float.value, [0, 1], [-6, 6]);
    return {
      transform: [{ translateY }, { rotate: `${rotate}deg` }],
    };
  });

  const animatedEyeStyle = useAnimatedStyle(() => {
    return {
      opacity: blink.value,
    };
  });

  return (
    <Animated.View style={animatedContainerStyle}>
      <Svg width={140} height={140} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2C9.79086 2 8 3.79086 8 6H16C16 3.79086 14.2091 2 12 2Z" stroke="#01579B" strokeWidth={1.2} />
        <Path d="M8 6V16C8 17.1046 8.89543 18 10 18H14C15.1046 18 16 17.1046 16 16V6H8Z" stroke="#01579B" strokeWidth={1.2} />
        <Path d="M10 14C10.5 15 11.5 15 12 14" stroke="#01579B" strokeWidth={1.2} strokeLinecap="round" />
        <Animated.View style={animatedEyeStyle}>
          <Path d="M15 11H9" stroke="#01579B" strokeWidth={1.2} strokeLinecap="round" />
        </Animated.View>
        <Path d="M17 18L16 15M7 18L8 15" stroke="#01579B" strokeWidth={1.2} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
};

// Componente genérico para animar la entrada de elementos
const AnimatedEntrance = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 800 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 12, stiffness: 100 }));
  }, [opacity, translateY, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
};

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!', headerBackTitle: 'Volver', headerTransparent: true, headerTintColor: '#01579B' }} />
      <LinearGradient
        colors={['#E1F5FE', '#B3E5FC']}
        style={styles.container}
      >
        <AnimatedEntrance delay={100}>
          <SadRobotIcon />
        </AnimatedEntrance>

        <AnimatedEntrance delay={300}>
          <Text style={styles.title}>Página no encontrada</Text>
        </AnimatedEntrance>

        <AnimatedEntrance delay={500}>
          <Text style={styles.subtitle}>La pantalla que buscas no existe o fue movida a otro universo.</Text>
        </AnimatedEntrance>

        <AnimatedEntrance delay={800}>
          <Link href="/" asChild>
            <Pressable>
              {({ pressed }) => (
                <Animated.View style={[styles.button, pressed && styles.buttonPressed]}>
                  <Text style={styles.buttonText}>Volver al Inicio</Text>
                </Animated.View>
              )}
            </Pressable>
          </Link>
        </AnimatedEntrance>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#01579B',
    marginTop: 32,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#546E7A',
    marginTop: 16,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 26,
  },
  button: {
    marginTop: 48,
    backgroundColor: '#0288D1',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 99,
    shadowColor: '#01579B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: '#0277BD',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
