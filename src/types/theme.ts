export interface ThemeColors {
    primary: string;
    primaryDark: string;
    background: string;
    cardBackground: string;
    text: string;
    textSecondary: string;
    textLight: string;
    border: string;
    white: string;
    black: string;
    error: string;
    success: string;
    warning: string;
}

export interface FontConfig {
    fontFamily: string;
    fontWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    fontSize: number;
    lineHeight: number;
}

export interface ThemeFonts {
    regular: FontConfig;
    medium: FontConfig;
    light: FontConfig;
    thin: FontConfig;
}
