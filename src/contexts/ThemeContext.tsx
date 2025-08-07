import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MD3DarkTheme as PaperDarkTheme,
  MD3LightTheme as PaperLightTheme,
  adaptNavigationTheme,
} from 'react-native-paper';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  Theme as NavigationTheme,
} from '@react-navigation/native';
import { MD3Theme } from 'react-native-paper/lib/typescript/types';

// --- Combinar temas de Paper y Navigation ---
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

// --- Definir colores personalizados ---
const customColors = {
  primary: '#0EA5E9',         // Celeste vibrante
  primaryDark: '#0284C7',      // Celeste más oscuro
  primaryLight: '#E0F2FE',     // Celeste muy claro
  accent: '#E0F2FE',           // Mismo que primaryLight
  text: '#0F172A',             // Gris muy oscuro (casi negro)
  textSecondary: '#64748B',     // Gris medio
  textLight: '#F8FAFC',         // Blanco humo
  backgroundLight: '#F8FAFC',   // Fondo claro
  backgroundDark: '#0F172A',    // Fondo oscuro
  cardBackgroundLight: '#FFFFFF',
  cardBackgroundDark: '#1E293B',
  borderLight: '#E2E8F0',       // Borde claro
  borderDark: '#334155',        // Borde oscuro
};

// --- Crear temas completos extendiendo los por defecto ---
// --- Definir un tipo de tema extendido ---
export type AppTheme = MD3Theme & NavigationTheme & {
  colors: {
    primaryDark: string;
    primaryLight: string;
    accent: string;
    textLight: string;
    textSecondary: string;
    cardBackground: string;
  };
};

// --- Crear temas completos extendiendo los por defecto ---
const CombinedDefaultTheme = {
  ...PaperLightTheme,
  ...LightTheme,
  colors: {
    ...PaperLightTheme.colors,
    ...LightTheme.colors,
    primary: customColors.primary,
    background: customColors.backgroundLight,
    card: customColors.backgroundLight,
    text: customColors.text,
    border: customColors.borderLight,
    notification: PaperLightTheme.colors.error,
    // Colores personalizados
    primaryDark: customColors.primaryDark,
    primaryLight: customColors.primaryLight,
    accent: customColors.accent,
    textLight: customColors.textLight,
    textSecondary: customColors.textSecondary,
    cardBackground: customColors.cardBackgroundLight,
  },
  fonts: {
    ...PaperLightTheme.fonts,
    // Asegurar que todas las fuentes tengan lineHeight definido
    displayLarge: { ...PaperLightTheme.fonts.displayLarge, lineHeight: PaperLightTheme.fonts.displayLarge.lineHeight || 64 },
    displayMedium: { ...PaperLightTheme.fonts.displayMedium, lineHeight: PaperLightTheme.fonts.displayMedium.lineHeight || 52 },
    displaySmall: { ...PaperLightTheme.fonts.displaySmall, lineHeight: PaperLightTheme.fonts.displaySmall.lineHeight || 44 },
    headlineLarge: { ...PaperLightTheme.fonts.headlineLarge, lineHeight: PaperLightTheme.fonts.headlineLarge.lineHeight || 40 },
    headlineMedium: { ...PaperLightTheme.fonts.headlineMedium, lineHeight: PaperLightTheme.fonts.headlineMedium.lineHeight || 36 },
    headlineSmall: { ...PaperLightTheme.fonts.headlineSmall, lineHeight: PaperLightTheme.fonts.headlineSmall.lineHeight || 32 },
    titleLarge: { ...PaperLightTheme.fonts.titleLarge, lineHeight: PaperLightTheme.fonts.titleLarge.lineHeight || 28 },
    titleMedium: { ...PaperLightTheme.fonts.titleMedium, lineHeight: PaperLightTheme.fonts.titleMedium.lineHeight || 24 },
    titleSmall: { ...PaperLightTheme.fonts.titleSmall, lineHeight: PaperLightTheme.fonts.titleSmall.lineHeight || 20 },
    labelLarge: { ...PaperLightTheme.fonts.labelLarge, lineHeight: PaperLightTheme.fonts.labelLarge.lineHeight || 20 },
    labelMedium: { ...PaperLightTheme.fonts.labelMedium, lineHeight: PaperLightTheme.fonts.labelMedium.lineHeight || 16 },
    labelSmall: { ...PaperLightTheme.fonts.labelSmall, lineHeight: PaperLightTheme.fonts.labelSmall.lineHeight || 16 },
    bodyLarge: { ...PaperLightTheme.fonts.bodyLarge, lineHeight: PaperLightTheme.fonts.bodyLarge.lineHeight || 24 },
    bodyMedium: { ...PaperLightTheme.fonts.bodyMedium, lineHeight: PaperLightTheme.fonts.bodyMedium.lineHeight || 20 },
    bodySmall: { ...PaperLightTheme.fonts.bodySmall, lineHeight: PaperLightTheme.fonts.bodySmall.lineHeight || 16 },
  },
} as AppTheme;

const CombinedDarkTheme = {
  ...PaperDarkTheme,
  ...DarkTheme,
  colors: {
    ...PaperDarkTheme.colors,
    ...DarkTheme.colors,
    primary: customColors.primary,
    background: customColors.backgroundDark,
    card: customColors.backgroundDark,
    text: customColors.textLight,
    border: customColors.borderDark,
    notification: PaperDarkTheme.colors.error,
    // Colores personalizados
    primaryDark: customColors.primaryDark,
    primaryLight: customColors.primaryLight,
    accent: customColors.accent,
    textLight: customColors.textLight,
    textSecondary: '#94A3B8', // Un gris más claro para el tema oscuro
    cardBackground: customColors.cardBackgroundDark,
  },
  fonts: {
    ...PaperDarkTheme.fonts,
    // Asegurar que todas las fuentes tengan lineHeight definido
    displayLarge: { ...PaperDarkTheme.fonts.displayLarge, lineHeight: PaperDarkTheme.fonts.displayLarge.lineHeight || 64 },
    displayMedium: { ...PaperDarkTheme.fonts.displayMedium, lineHeight: PaperDarkTheme.fonts.displayMedium.lineHeight || 52 },
    displaySmall: { ...PaperDarkTheme.fonts.displaySmall, lineHeight: PaperDarkTheme.fonts.displaySmall.lineHeight || 44 },
    headlineLarge: { ...PaperDarkTheme.fonts.headlineLarge, lineHeight: PaperDarkTheme.fonts.headlineLarge.lineHeight || 40 },
    headlineMedium: { ...PaperDarkTheme.fonts.headlineMedium, lineHeight: PaperDarkTheme.fonts.headlineMedium.lineHeight || 36 },
    headlineSmall: { ...PaperDarkTheme.fonts.headlineSmall, lineHeight: PaperDarkTheme.fonts.headlineSmall.lineHeight || 32 },
    titleLarge: { ...PaperDarkTheme.fonts.titleLarge, lineHeight: PaperDarkTheme.fonts.titleLarge.lineHeight || 28 },
    titleMedium: { ...PaperDarkTheme.fonts.titleMedium, lineHeight: PaperDarkTheme.fonts.titleMedium.lineHeight || 24 },
    titleSmall: { ...PaperDarkTheme.fonts.titleSmall, lineHeight: PaperDarkTheme.fonts.titleSmall.lineHeight || 20 },
    labelLarge: { ...PaperDarkTheme.fonts.labelLarge, lineHeight: PaperDarkTheme.fonts.labelLarge.lineHeight || 20 },
    labelMedium: { ...PaperDarkTheme.fonts.labelMedium, lineHeight: PaperDarkTheme.fonts.labelMedium.lineHeight || 16 },
    labelSmall: { ...PaperDarkTheme.fonts.labelSmall, lineHeight: PaperDarkTheme.fonts.labelSmall.lineHeight || 16 },
    bodyLarge: { ...PaperDarkTheme.fonts.bodyLarge, lineHeight: PaperDarkTheme.fonts.bodyLarge.lineHeight || 24 },
    bodyMedium: { ...PaperDarkTheme.fonts.bodyMedium, lineHeight: PaperDarkTheme.fonts.bodyMedium.lineHeight || 20 },
    bodySmall: { ...PaperDarkTheme.fonts.bodySmall, lineHeight: PaperDarkTheme.fonts.bodySmall.lineHeight || 16 },
  },
} as AppTheme;

// --- Definir el tipo para el contexto ---
interface ThemeContextType {
  isDarkTheme: boolean;
  toggleTheme: () => void;
  theme: AppTheme;
}

// --- Crear el contexto ---
export const ThemeContext = createContext<ThemeContextType>({
  isDarkTheme: false,
  toggleTheme: () => {},
  theme: CombinedDefaultTheme,
});

// --- Crear el proveedor del tema ---
export const CustomThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const colorScheme = useColorScheme();
  const [isDarkTheme, setIsDarkTheme] = useState(colorScheme === 'dark');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme !== null) {
          setIsDarkTheme(savedTheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme from AsyncStorage:', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme to AsyncStorage:', error);
    }
  };

  const theme = useMemo(() => (isDarkTheme ? CombinedDarkTheme : CombinedDefaultTheme), [isDarkTheme]);

  return (
    <ThemeContext.Provider value={{ isDarkTheme, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// --- Hook personalizado para usar el tema ---
export const useTheme = () => useContext(ThemeContext);
