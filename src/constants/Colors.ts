// =================================================================
// src/constants/Colors.ts - v2.3 (Estructura Unificada y Final)
// =================================================================

const AppColors = {
  primary: '#003366',
  primaryDark: '#002244',
  accent: '#ffc107',
  
  textDark: '#212529',
  textLight: '#FFFFFF',
  
  grayMedium: '#6c757d',
  grayLight: '#f4f6f8',
  
  background: '#f4f6f8',
  cardBackground: '#FFFFFF',
  
  border: '#dee2e6', 
  
  success: '#28a745',
  error: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
};

export const Colors = {
  light: {
    text: AppColors.textDark,
    background: AppColors.background,
    tint: AppColors.primary,
    icon: AppColors.grayMedium,
    border: AppColors.border,
    primary: AppColors.primary,
    primaryDark: AppColors.primaryDark,
    accent: AppColors.accent,
    cardBackground: AppColors.cardBackground,
    grayMedium: AppColors.grayMedium,
    grayLight: AppColors.grayLight, // Propiedad añadida
    textLight: AppColors.textLight,
    success: AppColors.success,
    error: AppColors.error,
    warning: AppColors.warning,
    info: AppColors.info,
  },
  dark: {
    text: AppColors.textLight,
    background: '#121212',
    tint: AppColors.textLight,
    icon: '#adb5bd',
    border: '#343a40',
    primary: AppColors.primary,
    primaryDark: AppColors.primaryDark,
    accent: AppColors.accent,
    cardBackground: '#1E1E1E',
    grayMedium: '#adb5bd',
    grayLight: '#2C2C2C',
    textLight: AppColors.textLight,
    success: AppColors.success,
    error: AppColors.error,
    warning: AppColors.warning,
    info: AppColors.info,
  },
};
