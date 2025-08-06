import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../src/hooks/useTheme';

const LogoutIcon = ({ color }: { color: string }) => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

interface AppHeaderProps {
    user: any;
    onLogout: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ user, onLogout }) => {
    const { colors, styles } = useTheme();

    return (
        <View style={styles.appHeader}>
            <View>
                <Text style={styles.welcomeSubtitle}>Bienvenido,</Text>
                <Text style={styles.welcomeTitle}>{user?.nombre?.split(' ')[0] || 'Inspector'}</Text>
            </View>
            <TouchableOpacity onPress={onLogout} style={styles.headerButton}>
                <LogoutIcon color={colors.text} />
            </TouchableOpacity>
        </View>
    );
};

export default AppHeader;
