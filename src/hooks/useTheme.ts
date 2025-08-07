import { useColorScheme } from 'react-native';
import { ThemeColors, ThemeFonts } from '@/types/theme';
import { getGlobalStyles } from '@/constants/globalStyles';

const lightColors: ThemeColors = {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#6c757d',
    primary: '#87CEEB',
    primaryDark: '#4682B4',
    cardBackground: '#F9F9F9',
    border: '#E0E0E0',
    white: '#FFFFFF',
    black: '#000000',
    error: '#dc3545',
    success: '#28a745',
    warning: '#ffc107',
    textLight: '#FFFFFF',
};

const darkColors: ThemeColors = {
    background: '#121212',
    text: '#FFFFFF',
    textSecondary: '#adb5bd',
    primary: '#87CEEB',
    primaryDark: '#4682B4',
    cardBackground: '#1E1E1E',
    border: '#2C2C2C',
    white: '#FFFFFF',
    black: '#000000',
    error: '#dc3545',
    success: '#28a745',
    warning: '#ffc107',
    textLight: '#FFFFFF',
};

// Default font configuration to prevent lineHeight undefined errors
const defaultFonts: ThemeFonts = {
    regular: {
        fontFamily: 'System',
        fontWeight: '400' as const,
        fontSize: 14,
        lineHeight: 20,
    },
    medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
        fontSize: 14,
        lineHeight: 20,
    },
    light: {
        fontFamily: 'System',
        fontWeight: '300' as const,
        fontSize: 14,
        lineHeight: 20,
    },
    thin: {
        fontFamily: 'System',
        fontWeight: '100' as const,
        fontSize: 14,
        lineHeight: 20,
    },
};

export function useTheme() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = colorScheme === 'dark' ? darkColors : lightColors;
    const styles = getGlobalStyles(colors, colorScheme);

    return {
        colors,
        styles,
        colorScheme,
        fonts: defaultFonts,
    };
}
