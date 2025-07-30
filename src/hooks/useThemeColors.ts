import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/Colors';

const themeObject = (colorScheme: 'light' | 'dark') => ({
    colorScheme,
    ...Colors[colorScheme],
    primary: '#00AEEF',
    primaryDark: '#008ACD',
    primaryLight: colorScheme === 'dark' ? '#2F3F4E' : '#E0F8FF',
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    background: colorScheme === 'dark' ? '#121212' : '#F7F8FA',
    cardBackground: colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
    text: Colors[colorScheme].text,
    textSecondary: colorScheme === 'dark' ? '#B0B0B0' : '#6c757d',
    textLight: colorScheme === 'dark' ? '#FFFFFF' : '#FFFFFF',
    border: colorScheme === 'dark' ? '#2F2F2F' : '#E0E0E0',
    white: '#FFFFFF',
    black: '#000000',
});

export type ThemeColors = ReturnType<typeof themeObject>;

export function useThemeColors(): ThemeColors {
    const colorScheme = useColorScheme() ?? 'light';

    return themeObject(colorScheme);
}
