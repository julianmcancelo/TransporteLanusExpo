/**
 * Sistema de notificaciones toast mejorado con animaciones
 * Proporciona feedback visual elegante para acciones del usuario
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Snackbar, IconButton } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { AnimationUtils } from '../../utils/animations';

const { width: screenWidth } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
}

interface ToastNotificationProps extends ToastConfig {
  visible: boolean;
  onDismiss: () => void;
}

/**
 * Componente de notificación toast individual
 */
export const ToastNotification: React.FC<ToastNotificationProps> = ({
  visible,
  type,
  title,
  message,
  duration = 4000,
  action,
  onDismiss,
}) => {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        AnimationUtils.fadeIn(opacity, 300),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      handleDismiss();
    }
  }, [visible, duration]);

  const handleDismiss = () => {
    Animated.parallel([
      AnimationUtils.fadeOut(opacity, 200),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getToastColors = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#4CAF50',
          iconColor: '#FFFFFF',
          textColor: '#FFFFFF',
          icon: 'check-circle',
        };
      case 'error':
        return {
          backgroundColor: '#F44336',
          iconColor: '#FFFFFF',
          textColor: '#FFFFFF',
          icon: 'alert-circle',
        };
      case 'warning':
        return {
          backgroundColor: '#FF9800',
          iconColor: '#FFFFFF',
          textColor: '#FFFFFF',
          icon: 'alert',
        };
      case 'info':
      default:
        return {
          backgroundColor: theme.colors.primary,
          iconColor: '#FFFFFF',
          textColor: '#FFFFFF',
          icon: 'information',
        };
    }
  };

  const colors = getToastColors();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor: colors.backgroundColor }]}>
        <View style={styles.content}>
          <IconButton
            icon={colors.icon}
            iconColor={colors.iconColor}
            size={24}
            style={styles.icon}
          />
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.textColor }]}>
              {title}
            </Text>
            {message && (
              <Text style={[styles.message, { color: colors.textColor }]}>
                {message}
              </Text>
            )}
          </View>
          {action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={action.onPress}
            >
              <Text style={[styles.actionText, { color: colors.textColor }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
          >
            <IconButton
              icon="close"
              iconColor={colors.iconColor}
              size={20}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

/**
 * Hook para manejar notificaciones toast
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<(ToastConfig & { id: string })[]>([]);

  const showToast = (config: ToastConfig) => {
    const id = Date.now().toString();
    const newToast = { ...config, id };
    
    setToasts(prev => [...prev, newToast]);
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (title: string, message?: string, duration?: number) => {
    showToast({ type: 'success', title, message, duration });
  };

  const showError = (title: string, message?: string, duration?: number) => {
    showToast({ type: 'error', title, message, duration });
  };

  const showWarning = (title: string, message?: string, duration?: number) => {
    showToast({ type: 'warning', title, message, duration });
  };

  const showInfo = (title: string, message?: string, duration?: number) => {
    showToast({ type: 'info', title, message, duration });
  };

  const clearAll = () => {
    setToasts([]);
  };

  return {
    toasts,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll,
  };
};

/**
 * Contenedor de notificaciones toast
 */
export const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();

  return (
    <View style={styles.toastContainer} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <ToastNotification
          key={toast.id}
          visible={true}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          action={toast.action}
          onDismiss={() => hideToast(toast.id)}
        />
      ))}
    </View>
  );
};

/**
 * Componente de Snackbar mejorado (alternativa más simple)
 */
interface EnhancedSnackbarProps {
  visible: boolean;
  onDismiss: () => void;
  message: string;
  type?: ToastType;
  action?: {
    label: string;
    onPress: () => void;
  };
  duration?: number;
}

export const EnhancedSnackbar: React.FC<EnhancedSnackbarProps> = ({
  visible,
  onDismiss,
  message,
  type = 'info',
  action,
  duration = 4000,
}) => {
  const theme = useTheme();
  const slideValue = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideValue, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getSnackbarStyle = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#4CAF50' };
      case 'error':
        return { backgroundColor: '#F44336' };
      case 'warning':
        return { backgroundColor: '#FF9800' };
      case 'info':
      default:
        return { backgroundColor: theme.colors.cardBackground };
    }
  };

  return (
    <Animated.View
      style={[
        styles.snackbarContainer,
        {
          transform: [{ translateY: slideValue }],
        },
      ]}
    >
      <Snackbar
        visible={visible}
        onDismiss={onDismiss}
        duration={duration}
        style={[styles.snackbar, getSnackbarStyle()]}
        action={action}
      >
        {message}
      </Snackbar>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 56,
  },
  icon: {
    margin: 0,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    opacity: 0.9,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    margin: 0,
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  snackbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  snackbar: {
    margin: 16,
    borderRadius: 8,
  },
});
