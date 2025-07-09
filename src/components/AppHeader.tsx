// =========================================================================
// ARCHIVO: src/components/AppHeader.tsx (Componente de Cabecera Corregido)
// =========================================================================
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

// CORRECCIÓN: Se importa el tipo correcto 'UserSession' desde el contexto
import { UserSession } from '../contexts/AuthContext';
// CORRECCIÓN: Se importa el objeto 'Colors' con la 'C' mayúscula para coincidir con el nombre del archivo
import { Colors } from '@/constants/Colors';

interface AppHeaderProps {
  user: UserSession | null;
  onLogout: () => void;
}

const LogoutIcon = ({ color }: { color: string }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;

const AppHeader: React.FC<AppHeaderProps> = ({ user, onLogout }) => {
  // CORRECCIÓN: Se selecciona el tema (light) para obtener los colores
  const themeColors = Colors.light;
  const styles = getStyles(themeColors);
  
  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <View>
                <Text style={styles.welcomeSubtitle}>Inspector</Text>
                <Text style={styles.welcomeTitle}>{user?.nombre || 'No identificado'}</Text>
            </View>
            <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
                <LogoutIcon color={themeColors.primary} />
            </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
};

// CORRECCIÓN: La función ahora recibe el objeto de tema (ej. Colors.light)
const getStyles = (colors: typeof Colors.light) => StyleSheet.create({
    safeArea: {
        backgroundColor: colors.cardBackground,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: colors.grayMedium,
    },
    welcomeTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    logoutButton: {
        padding: 10,
        borderRadius: 99,
        backgroundColor: `${colors.primary}1A`,
    },
});

export default AppHeader;
