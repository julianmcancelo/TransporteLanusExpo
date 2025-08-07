/**
 * Componentes animados reutilizables para mejorar la UX
 * Incluye componentes comunes con animaciones predefinidas
 */

import React, { useEffect, useRef, ReactNode } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { Button, Card, Text, ActivityIndicator } from 'react-native-paper';
import { AnimationUtils, AnimationPresets } from '../../utils/animations';

interface AnimatedViewProps {
  children: ReactNode;
  style?: ViewStyle;
  animationType?: 'fadeIn' | 'slideInRight' | 'bounceScale';
  duration?: number;
  delay?: number;
}

/**
 * Vista animada con entrada suave
 */
export const AnimatedView: React.FC<AnimatedViewProps> = ({
  children,
  style,
  animationType = 'fadeIn',
  duration,
  delay = 0,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(100)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      switch (animationType) {
        case 'fadeIn':
          AnimationUtils.fadeIn(animatedValue, duration).start();
          break;
        case 'slideInRight':
          Animated.parallel([
            AnimationUtils.fadeIn(animatedValue, duration),
            AnimationUtils.slideInRight(translateX, duration),
          ]).start();
          break;
        case 'bounceScale':
          Animated.parallel([
            AnimationUtils.fadeIn(animatedValue, duration),
            AnimationUtils.bounceScale(scale, duration),
          ]).start();
          break;
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [animationType, duration, delay, animatedValue, translateX, scale]);

  const getAnimatedStyle = () => {
    switch (animationType) {
      case 'slideInRight':
        return {
          opacity: animatedValue,
          transform: [{ translateX }],
        };
      case 'bounceScale':
        return {
          opacity: animatedValue,
          transform: [{ scale }],
        };
      default:
        return {
          opacity: animatedValue,
        };
    }
  };

  return (
    <Animated.View style={[style, getAnimatedStyle()]}>
      {children}
    </Animated.View>
  );
};

interface AnimatedCardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevation?: number;
}

/**
 * Card animada con efecto hover
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  onPress,
  elevation = 4,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const elevationValue = useRef(new Animated.Value(elevation)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.98,
        duration: AnimationPresets.buttonPress.duration,
        easing: AnimationPresets.buttonPress.easing,
        useNativeDriver: true,
      }),
      Animated.timing(elevationValue, {
        toValue: elevation + 2,
        duration: AnimationPresets.buttonPress.duration,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: AnimationPresets.buttonPress.duration,
        easing: AnimationPresets.buttonPress.easing,
        useNativeDriver: true,
      }),
      Animated.timing(elevationValue, {
        toValue: elevation,
        duration: AnimationPresets.buttonPress.duration,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleValue }],
          elevation: elevationValue,
        },
      ]}
    >
      <Card
        style={style}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {children}
      </Card>
    </Animated.View>
  );
};

interface AnimatedButtonProps {
  children: ReactNode;
  onPress: () => void;
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Botón animado con feedback visual
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onPress,
  mode = 'contained',
  style,
  disabled = false,
  loading = false,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (loading) {
      AnimationUtils.pulse(pulseValue).start();
    } else {
      pulseValue.setValue(1);
    }
  }, [loading, pulseValue]);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: AnimationPresets.buttonPress.duration,
        easing: AnimationPresets.buttonPress.easing,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: AnimationPresets.buttonPress.duration,
        easing: AnimationPresets.buttonPress.easing,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <Animated.View
      style={[
        {
          transform: [
            { scale: scaleValue },
            { scale: loading ? pulseValue : 1 },
          ],
        },
      ]}
    >
      <Button
        mode={mode}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
        disabled={disabled || loading}
        loading={loading}
      >
        {children}
      </Button>
    </Animated.View>
  );
};

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  style?: ViewStyle;
}

/**
 * Overlay de loading animado
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Cargando...',
  style,
}) => {
  const fadeValue = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        AnimationUtils.fadeIn(fadeValue, 300),
        AnimationUtils.spin(spinValue),
      ]).start();
    } else {
      AnimationUtils.fadeOut(fadeValue, 200).start();
      spinValue.setValue(0);
    }
  }, [visible, fadeValue, spinValue]);

  if (!visible) return null;

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.loadingOverlay, { opacity: fadeValue }, style]}>
      <View style={styles.loadingContent}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <ActivityIndicator size="large" />
        </Animated.View>
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  style?: ViewStyle;
}

/**
 * Barra de progreso animada
 */
export const AnimatedProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = '#007AFF',
  backgroundColor = '#E5E5EA',
  animated = true,
  style,
}) => {
  const progressValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      AnimationUtils.progressBar(progressValue, progress, 800).start();
    } else {
      progressValue.setValue(progress);
    }
  }, [progress, animated, progressValue]);

  const widthInterpolated = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.progressContainer, { height, backgroundColor }, style]}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            height,
            backgroundColor: color,
            width: widthInterpolated,
          },
        ]}
      />
    </View>
  );
};

interface FadeInListProps {
  children: ReactNode[];
  staggerDelay?: number;
  style?: ViewStyle;
}

/**
 * Lista con animación staggered
 */
export const FadeInList: React.FC<FadeInListProps> = ({
  children,
  staggerDelay = 100,
  style,
}) => {
  const animatedValues = useRef(
    children.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    AnimationUtils.staggeredFadeIn(animatedValues, staggerDelay).start();
  }, [children.length, animatedValues, staggerDelay]);

  return (
    <View style={style}>
      {children.map((child, index) => (
        <Animated.View
          key={index}
          style={{
            opacity: animatedValues[index],
            transform: [
              {
                translateY: animatedValues[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          {child}
        </Animated.View>
      ))}
    </View>
  );
};

interface ShakeViewProps {
  children: ReactNode;
  trigger: boolean;
  style?: ViewStyle;
}

/**
 * Vista que se sacude para indicar error
 */
export const ShakeView: React.FC<ShakeViewProps> = ({
  children,
  trigger,
  style,
}) => {
  const shakeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      AnimationUtils.shake(shakeValue).start();
    }
  }, [trigger, shakeValue]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateX: shakeValue }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 120,
  },
  loadingText: {
    marginTop: 10,
    textAlign: 'center',
  },
  progressContainer: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: 4,
  },
});
