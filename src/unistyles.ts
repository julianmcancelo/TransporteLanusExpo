// =================================================================
// ARCHIVO: src/unistyles.ts (CORREGIDO para Unistyles v1)
// Descripción: Configuración central para la versión 1.x.
// =================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
// Importa UnistylesRegistry en lugar de createUnistyles
import { UnistylesRegistry } from 'react-native-unistyles';

// Las definiciones de tu tema siguen siendo las mismas
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

const breakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
};

const lightTheme = {
    colors,
    spacing: {
        xsmall: 4,
        small: 8,
        medium: 16,
        large: 24,
    },
    borderRadius: {
        small: 4,
        medium: 8,
        large: 16,
    },
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

const asyncStorageAdapter = {
    getItem: async (key: string) => await AsyncStorage.getItem(key),
    setItem: async (key: string, value: string) => await AsyncStorage.setItem(key, value),
};

// Exporta el tipo del tema para usarlo en tus hojas de estilo
export type AppTheme = typeof lightTheme;

// Usa UnistylesRegistry para registrar todo.
// Esta es la sintaxis correcta para la v1.
UnistylesRegistry
    .addThemes({
        light: lightTheme,
        dark: darkTheme,
    })
    .addBreakpoints(breakpoints)
    .addConfig({
        // Opcional: define el tema inicial y el almacenamiento
        initialTheme: 'light',
        storage: asyncStorageAdapter
    });