/**
 * Componentes de estados de carga mejorados
 * Proporciona diferentes tipos de loading states con animaciones elegantes
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
} from 'react-native';
import { ActivityIndicator, Card, Button } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { AnimationUtils } from '../../utils/animations';

const { width: screenWidth } = Dimensions.get('window');

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  style?: any;
}

/**
 * Spinner de carga con mensaje animado
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color,
  message = 'Cargando...',
  style,
}) => {
  const theme = useTheme();
  const fadeValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AnimationUtils.fadeIn(fadeValue, 300).start();
    AnimationUtils.pulse(pulseValue).start();
  }, []);

  return (
    <Animated.View style={[styles.spinnerContainer, { opacity: fadeValue }, style]}>
      <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
        <ActivityIndicator
          size={size}
          color={color || theme.colors.primary}
          style={styles.spinner}
        />
      </Animated.View>
      {message && (
        <Text style={[styles.loadingMessage, { color: theme.colors.text }]}>
          {message}
        </Text>
      )}
    </Animated.View>
  );
};

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Componente skeleton para loading placeholders
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const theme = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.cardBackground, theme.colors.primary],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

interface CardSkeletonProps {
  showAvatar?: boolean;
  lines?: number;
  style?: any;
}

/**
 * Skeleton para cards de contenido
 */
export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showAvatar = false,
  lines = 3,
  style,
}) => {
  const theme = useTheme();

  return (
    <Card style={[styles.cardSkeleton, style]}>
      <Card.Content>
        <View style={styles.skeletonHeader}>
          {showAvatar && (
            <Skeleton
              width={40}
              height={40}
              borderRadius={20}
              style={styles.avatarSkeleton}
            />
          )}
          <View style={styles.skeletonTitleContainer}>
            <Skeleton width="70%" height={16} style={styles.titleSkeleton} />
            <Skeleton width="50%" height={12} style={styles.subtitleSkeleton} />
          </View>
        </View>
        <View style={styles.skeletonContent}>
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              width={index === lines - 1 ? '60%' : '100%'}
              height={12}
              style={styles.lineSkeleton}
            />
          ))}
        </View>
      </Card.Content>
    </Card>
  );
};

interface ListSkeletonProps {
  itemCount?: number;
  showAvatar?: boolean;
  style?: any;
}

/**
 * Skeleton para listas
 */
export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  itemCount = 5,
  showAvatar = true,
  style,
}) => {
  return (
    <View style={[styles.listSkeleton, style]}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <CardSkeleton
          key={index}
          showAvatar={showAvatar}
          lines={2}
          style={styles.listItem}
        />
      ))}
    </View>
  );
};

interface PulsingDotProps {
  color?: string;
  size?: number;
  delay?: number;
}

/**
 * Punto pulsante para indicadores de carga
 */
export const PulsingDot: React.FC<PulsingDotProps> = ({
  color = '#007AFF',
  size = 8,
  delay = 0,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleValue, {
            toValue: 1.5,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacityValue, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacityValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const timer = setTimeout(() => {
      animation.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.pulsingDot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        },
      ]}
    />
  );
};

interface ThreeDotsLoaderProps {
  color?: string;
  size?: number;
  style?: any;
}

/**
 * Loader de tres puntos animados
 */
export const ThreeDotsLoader: React.FC<ThreeDotsLoaderProps> = ({
  color = '#007AFF',
  size = 8,
  style,
}) => {
  return (
    <View style={[styles.threeDotsContainer, style]}>
      <PulsingDot color={color} size={size} delay={0} />
      <PulsingDot color={color} size={size} delay={200} />
      <PulsingDot color={color} size={size} delay={400} />
    </View>
  );
};

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: any;
}

/**
 * Estado vacío con animación
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox-outline',
  title,
  message,
  actionLabel,
  onActionPress,
  style,
}) => {
  const theme = useTheme();
  const fadeValue = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      AnimationUtils.fadeIn(fadeValue, 600),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.emptyStateContainer,
        {
          opacity: fadeValue,
          transform: [{ translateY }],
        },
        style,
      ]}
    >
      <View style={styles.emptyStateContent}>
        <View
          style={[
            styles.emptyStateIcon,
            { backgroundColor: theme.colors.cardBackground },
          ]}
        >
          <Text style={{ fontSize: 48, color: theme.colors.primary }}>📭</Text>
        </View>
        <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        {message && (
          <Text style={[styles.emptyStateMessage, { color: theme.colors.textSecondary }]}>
            {message}
          </Text>
        )}
        {actionLabel && onActionPress && (
          <Button
            mode="contained"
            onPress={onActionPress}
            style={styles.emptyStateButton}
          >
            {actionLabel}
          </Button>
        )}
      </View>
    </Animated.View>
  );
};

interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
  style?: any;
}

/**
 * Indicador de progreso por pasos
 */
export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  currentStep,
  totalSteps,
  stepTitles = [],
  style,
}) => {
  const theme = useTheme();
  const progressValues = useRef(
    Array.from({ length: totalSteps }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    progressValues.forEach((value, index) => {
      if (index < currentStep) {
        Animated.timing(value, {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: false,
        }).start();
      } else {
        value.setValue(0);
      }
    });
  }, [currentStep]);

  return (
    <View style={[styles.progressStepsContainer, style]}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index < currentStep;
        const isCurrent = index === currentStep - 1;

        return (
          <View key={index} style={styles.stepContainer}>
            <Animated.View
              style={[
                styles.stepCircle,
                {
                  backgroundColor: progressValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [theme.colors.border, theme.colors.primary],
                  }),
                  transform: [
                    {
                      scale: progressValues[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  {
                    color: isActive ? theme.colors.white : theme.colors.textSecondary,
                  },
                ]}
              >
                {index + 1}
              </Text>
            </Animated.View>
            {stepTitles[index] && (
              <Text
                style={[
                  styles.stepTitle,
                  {
                    color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                  },
                ]}
              >
                {stepTitles[index]}
              </Text>
            )}
            {index < totalSteps - 1 && (
              <Animated.View
                style={[
                  styles.stepConnector,
                  {
                    backgroundColor: progressValues[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [theme.colors.border, theme.colors.primary],
                    }),
                  },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  spinner: {
    marginBottom: 10,
  },
  loadingMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
  cardSkeleton: {
    marginBottom: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarSkeleton: {
    marginRight: 12,
  },
  skeletonTitleContainer: {
    flex: 1,
  },
  titleSkeleton: {
    marginBottom: 6,
  },
  subtitleSkeleton: {
    marginBottom: 0,
  },
  skeletonContent: {
    marginTop: 8,
  },
  lineSkeleton: {
    marginBottom: 6,
  },
  listSkeleton: {
    padding: 16,
  },
  listItem: {
    marginBottom: 8,
  },
  pulsingDot: {
    marginHorizontal: 2,
  },
  threeDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    marginTop: 8,
  },
  progressStepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 80,
  },
  stepConnector: {
    position: 'absolute',
    top: 16,
    left: '50%',
    right: '-50%',
    height: 2,
    zIndex: -1,
  },
});
