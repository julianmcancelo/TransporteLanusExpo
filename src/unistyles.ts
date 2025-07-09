// =================================================================
// ARCHIVO: src/unistyles.ts (CORREGIDO)
// Descripción: Configuración central de Unistyles para la app.
// =================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUnistyles } from 'react-native-unistyles';

// 1. Define tu paleta de colores
const colors = {
    text: '#111827',
    background: '#fff',
    primary: '#007AFF',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    grayLight: '#f0f0f0',
    grayMedium: '#8e8e93',
    cardBackground: '#ffffff',
};

// 2. Define tus breakpoints
const breakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
};

// 3. Define tus temas
const lightTheme = {
    colors,
    spacing: {
        xsmall: 4, // <-- AÑADIDO
        small: 8,
        medium: 16,
        large: 24,
    },
    borderRadius: {
        small: 4,
        medium: 8,
        large: 16,
    },
    // Objeto de sombras AÑADIDO
    shadows: {
        light: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.18,
            shadowRadius: 1.00,
            elevation: 1,
        },
        medium: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.23,
            shadowRadius: 2.62,
            elevation: 4,
        }
    }
};

const darkTheme = {
    ...lightTheme,
    colors: {
        ...colors,
        background: '#000000',
        text: '#ffffff',
        cardBackground: '#1c1c1e',
    }
};

// 4. Configura el adaptador de almacenamiento
const asyncStorageAdapter = {
    getItem: async (key: string) => await AsyncStorage.getItem(key),
    setItem: async (key: string, value: string) => await AsyncStorage.setItem(key, value),
};

// 5. Crea y exporta las herramientas de Unistyles
export const { createStyleSheet, useStyles } = createUnistyles(
    {
        light: lightTheme,
        dark: darkTheme,
    },
    breakpoints,
    {
        storage: asyncStorageAdapter,
    }
);

// Exporta el tipo del tema para usarlo en tus hojas de estilo
export type AppTheme = typeof lightTheme;