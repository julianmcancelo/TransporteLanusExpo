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



// src/constants/colors.js

export const PRIMARY_COLOR = '#007bff';
export const PRIMARY_DARK_COLOR = '#0056b3';
export const ACCENT_COLOR = '#ffc107';
export const TEXT_DARK_COLOR = '#212529';
export const TEXT_LIGHT_COLOR = '#f8f9fa';
export const GRAY_MEDIUM_COLOR = '#6c757d';
export const GRAY_LIGHT_COLOR = '#e9ecef';
export const BACKGROUND_COLOR = '#f0f2f5';
export const CARD_BACKGROUND_COLOR = '#ffffff';
export const BORDER_COLOR_LIGHT = '#ddd';
export const BORDER_COLOR_DARK = '#ccc';

export const SUCCESS_COLOR = '#28a745';
export const ERROR_COLOR = '#dc354f';
export const WARNING_COLOR = ACCENT_COLOR;
export const INFO_COLOR = PRIMARY_COLOR;