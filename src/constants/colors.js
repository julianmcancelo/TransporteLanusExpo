// =================================================================
// src/constants/Colors.ts - v1.2 (Propiedad 'icon' añadida)
// =================================================================

// 1. Definimos todos los colores base de tu paleta original en un solo lugar.
const AppColors = {
  primary: '#003366',
  primaryDark: '#002244',
  accent: '#ffc107',
  
  textDark: '#212529',
  textLight: '#FFFFFF',
  
  grayMedium: '#6c757d',
  
  background: '#f4f6f8',
  cardBackground: '#FFFFFF',
  
  success: '#28a745',
  error: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
};

// 2. Exportamos el objeto 'Colors' con las paletas para modo claro y oscuro.
export const Colors = {
  light: {
    // Colores de UI genéricos
    text: AppColors.textDark,
    background: AppColors.background,
    tint: AppColors.primary,
    icon: AppColors.grayMedium, // <-- LÍNEA AÑADIDA

    // Colores específicos de tu app
    primary: AppColors.primary,
    primaryDark: AppColors.primaryDark,
    accent: AppColors.accent,
    cardBackground: AppColors.cardBackground,
    grayMedium: AppColors.grayMedium,
    textLight: AppColors.textLight,

    // Colores de estado
    success: AppColors.success,
    error: AppColors.error,
    warning: AppColors.warning,
    info: AppColors.info,
  },
  dark: {
    // Colores de UI genéricos
    text: AppColors.textLight,
    background: '#121212',
    tint: AppColors.textLight,
    icon: '#adb5bd', // <-- LÍNEA AÑADIDA

    // Colores específicos de tu app
    primary: AppColors.primary,
    primaryDark: AppColors.primaryDark,
    accent: AppColors.accent,
    cardBackground: '#1E1E1E',
    grayMedium: '#adb5bd',
    textLight: AppColors.textLight,

    // Los colores de estado suelen funcionar bien en ambos temas
    success: AppColors.success,
    error: AppColors.error,
    warning: AppColors.warning,
    info: AppColors.info,
  },
};

// Definimos los colores base para no repetirlos
const COLORS = {
  primary: '#005c9e',
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  lightText: '#f8f9fa',
  darkText: '#212529',
  mediumGray: '#6c757d',
  lightGray: '#f8f9fa',
  cardBackground: '#ffffff',
};


