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
import { MD3Theme, ThemeProp } from 'react-native-paper/lib/typescript/types';

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
