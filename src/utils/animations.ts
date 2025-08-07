/**
 * Utilidades de animaciones para mejorar la experiencia de usuario
 * Proporciona configuraciones predefinidas para animaciones comunes
 */

import { Animated, Easing } from 'react-native';

export class AnimationUtils {
  /**
   * Animación de fade in suave
   */
  static fadeIn(animatedValue: Animated.Value, duration: number = 300): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
  }

  /**
   * Animación de fade out suave
   */
  static fadeOut(animatedValue: Animated.Value, duration: number = 300): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });
  }

  /**
   * Animación de slide in desde la derecha
   */
  static slideInRight(animatedValue: Animated.Value, duration: number = 400): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    });
  }

  /**
   * Animación de slide out hacia la izquierda
   */
  static slideOutLeft(animatedValue: Animated.Value, duration: number = 300): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: -100,
      duration,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });
  }

  /**
   * Animación de escala (bounce effect)
   */
  static bounceScale(animatedValue: Animated.Value, duration: number = 600): Animated.CompositeAnimation {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.1,
        duration: duration * 0.3,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: duration * 0.7,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
    ]);
  }

  /**
   * Animación de pulso para botones
   */
  static pulse(animatedValue: Animated.Value): Animated.CompositeAnimation {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
  }

  /**
   * Animación de shake para errores
   */
  static shake(animatedValue: Animated.Value): Animated.CompositeAnimation {
    return Animated.sequence([
      Animated.timing(animatedValue, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(animatedValue, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(animatedValue, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(animatedValue, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]);
  }

  /**
   * Animación de loading spinner
   */
  static spin(animatedValue: Animated.Value): Animated.CompositeAnimation {
    return Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
  }

  /**
   * Animación de progress bar
   */
  static progressBar(
    animatedValue: Animated.Value, 
    targetProgress: number, 
    duration: number = 1000
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: targetProgress,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // Layout animations require native driver false
    });
  }

  /**
   * Animación de entrada staggered para listas
   */
  static staggeredFadeIn(
    animatedValues: Animated.Value[], 
    delay: number = 100
  ): Animated.CompositeAnimation {
    const animations = animatedValues.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 400,
        delay: index * delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );

    return Animated.parallel(animations);
  }

  /**
   * Animación de card flip
   */
  static cardFlip(animatedValue: Animated.Value): Animated.CompositeAnimation {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 90,
        duration: 300,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
  }
}

/**
 * Configuraciones predefinidas para diferentes tipos de animaciones
 */
export const AnimationPresets = {
  // Transiciones de pantalla
  screenTransition: {
    duration: 400,
    easing: Easing.out(Easing.cubic),
  },
  
  // Animaciones de botones
  buttonPress: {
    duration: 150,
    easing: Easing.out(Easing.quad),
  },
  
  // Animaciones de modal
  modalSlide: {
    duration: 350,
    easing: Easing.out(Easing.back(1.1)),
  },
  
  // Animaciones de loading
  loading: {
    duration: 1200,
    easing: Easing.linear,
  },
  
  // Animaciones de feedback
  feedback: {
    duration: 200,
    easing: Easing.out(Easing.quad),
  },
};

/**
 * Hook personalizado para manejar animaciones comunes
 */
export const useAnimatedValue = (initialValue: number = 0) => {
  const animatedValue = new Animated.Value(initialValue);
  
  return {
    value: animatedValue,
    fadeIn: (duration?: number) => AnimationUtils.fadeIn(animatedValue, duration),
    fadeOut: (duration?: number) => AnimationUtils.fadeOut(animatedValue, duration),
    slideInRight: (duration?: number) => AnimationUtils.slideInRight(animatedValue, duration),
    slideOutLeft: (duration?: number) => AnimationUtils.slideOutLeft(animatedValue, duration),
    bounceScale: (duration?: number) => AnimationUtils.bounceScale(animatedValue, duration),
    pulse: () => AnimationUtils.pulse(animatedValue),
    shake: () => AnimationUtils.shake(animatedValue),
    spin: () => AnimationUtils.spin(animatedValue),
  };
};
