import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StatusBar, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// --- Iconos SVG ---
type IconProps = { color: string; size?: number };
const ChevronRightIcon = ({ color, size = 24 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const FilePlusIcon = ({ color, size = 32 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M14 2v6h6M12 18v-6M9 15h6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const ClockIcon = ({ color, size = 32 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M12 6v6l4 2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const TagIcon = ({ color, size = 32 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L3 13V4h9l7.59 7.59a2 2 0 010 2.82z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M7 7h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;


// --- Componente de Tarjeta de Acción ---
const TramiteCard = ({ icon, title, subtitle, onPress }: { icon: React.ReactNode; title: string; subtitle: string; onPress: () => void; }) => {
    const styles = getStyles();
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.cardIconContainer}>{icon}</View>
            <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSubtitle}>{subtitle}</Text>
            </View>
            <ChevronRightIcon color="#CBD5E1" />
        </TouchableOpacity>
    );
};

// --- Pantalla de Selección de Trámite ---
export default function SeleccionarTramiteScreen() {
    const router = useRouter();
    const styles = getStyles();

    const tramites = [
        {
            title: 'Nueva Inspección',
            subtitle: 'Realizar una inspección de rutina a un vehículo.',
            icon: <FilePlusIcon color="#0284C7" />,
            onPress: () => router.push('./nueva-inspeccion' as any),
        },
        {
            title: 'Colocar Oblea',
            subtitle: 'Registrar la colocación de una oblea y firmar.',
            icon: <TagIcon color="#0284C7" />,
            onPress: () => router.push('./obleas' as any),
        },
        {
            title: 'Consultar Historial',
            subtitle: 'Buscar habilitaciones o inspecciones pasadas.',
            icon: <ClockIcon color="#0284C7" />,
            onPress: () => router.push('./historial' as any),
        },
    ];

    return (
        <SafeAreaView style={styles.mainContainer}>
            <LinearGradient colors={['#0093D2', '#007AB8']} style={styles.header}>
                <Text style={styles.headerTitle}>Seleccionar Trámite</Text>
                <Text style={styles.headerSubtitle}>Elige una opción para continuar</Text>
            </LinearGradient>
            <ScrollView contentContainerStyle={styles.container}>
                {tramites.map((tramite, index) => (
                    <TramiteCard
                        key={index}
                        icon={tramite.icon}
                        title={tramite.title}
                        subtitle={tramite.subtitle}
                        onPress={tramite.onPress}
                    />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

// --- Estilos ---
const getStyles = () => StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#F1F5F9' },
    header: {
        paddingHorizontal: 24,
        paddingTop: (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0) + 30,
        paddingBottom: 30,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    container: {
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2, },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 5,
    },
    cardIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
    },
});
