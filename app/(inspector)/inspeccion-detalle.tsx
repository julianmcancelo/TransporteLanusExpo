// =========================================================================
// ARCHIVO: app/(inspector)/inspeccion-detalle.tsx (v1.0 - Diseño Estético)
// Muestra el detalle de la habilitación seleccionada.
// =========================================================================

import { Colors } from '@/constants/Colors'; // Asumiendo que tenés este archivo de colores
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// --- Tipos (Es buena práctica tenerlos en un archivo compartido) ---
interface Habilitacion {
    id: string;
    nro_licencia: string;
    estado: 'Vigente' | 'Vencida' | 'En Proceso' | string;
    tipo_transporte: string;
    expte: string;
}
interface Titular { nombre: string; dni: string; }
import type { Vehiculo } from '../../src/types/habilitacion';
interface Turno { fecha: string; hora: string; estado: string; }
interface Tramite {
    habilitacion: Habilitacion;
    titular: Titular | null;
    vehiculo: Vehiculo | null;
    turno: Turno | null;
}
type IconProps = { color: string, size?: number };

// --- Iconos ---
const ArrowLeftIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const UserIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const CarIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M14 16.67H9.33a1 1 0 01-1-1V12.33a1 1 0 011-1H14a1 1 0 011 1v3.34a1 1 0 01-1 1z" stroke={color} strokeWidth="2" /><Path d="M10.33 11.33V8.83a2 2 0 012-2h0a2 2 0 012 2v2.5M17.5 16.67h1a1 1 0 001-1V10.83a3 3 0 00-3-3H7.5a3 3 0 00-3 3v4.84a1 1 0 001 1h1m9 0v2m-9-2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const CalendarIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M8 2v4M16 2v4M3 10h18M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const FileTextIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;


// --- Componentes Reutilizables de UI ---

const StatusBadge = ({ estado, themeColors, styles }: { estado: Habilitacion['estado'], themeColors: any, styles: any }) => {
    const statusInfo = useMemo(() => ({
        Vigente: { color: themeColors.success, label: 'Vigente' },
        Vencida: { color: themeColors.error, label: 'Vencida' },
        'En Proceso': { color: themeColors.warning, label: 'En Proceso' },
    }), [themeColors]);
    const currentStatus = statusInfo[estado as keyof typeof statusInfo] || { color: themeColors.grayMedium, label: estado };
    return (
        <View style={[styles.statusBadge, { backgroundColor: currentStatus.color }]}>
            <Text style={styles.statusBadgeText}>{currentStatus.label}</Text>
        </View>
    );
};

const InfoRow = ({ label, value, icon }: { label: string, value?: string | null, icon: React.ReactNode }) => {
    const styles = getStyles(Colors.light); // Usamos un tema base, ya que los estilos son consistentes
    if (!value) return null;
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>{icon}</View>
            <View style={styles.infoTextContainer}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value} numberOfLines={1}>{value}</Text>
            </View>
        </View>
    );
};

const DetailCard = ({ title, children, headerAccessory }: { title: string, children: React.ReactNode, headerAccessory?: React.ReactNode }) => {
    const styles = getStyles(Colors.light);
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{title}</Text>
                {headerAccessory}
            </View>
            <View style={styles.cardContent}>
                {children}
            </View>
        </View>
    );
};

// --- Pantalla Principal de Detalle ---

export default function InspeccionDetalleScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = useMemo(() => ({
        ...Colors[colorScheme],
        primary: '#00AEEF',
        primaryDark: '#008ACD',
    }), [colorScheme]);
    const styles = getStyles(themeColors);

    const [tramite, setTramite] = useState<Tramite | null>(null);

    useEffect(() => {
        if (params.tramite && typeof params.tramite === 'string') {
            try {
                setTramite(JSON.parse(params.tramite));
            } catch (error) {
                console.error("Error al parsear los datos del trámite:", error);
            }
        }
    }, [params.tramite]);

    if (!tramite) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={themeColors.primary} />
                    <Text style={{ marginTop: 10, color: themeColors.grayMedium }}>Cargando datos...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const { habilitacion, titular, vehiculo, turno } = tramite;

    const turnoInfo = turno
        ? `${new Date(turno.fecha + 'T00:00:00').toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: 'numeric'})} a las ${turno.hora.substring(0, 5)} hs`
        : 'Sin datos';

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen
                options={{
                    title: `Licencia ${habilitacion.nro_licencia}`,
                    headerStyle: { backgroundColor: themeColors.background },
                    headerTitleStyle: { color: themeColors.text, fontWeight: 'bold' },
                    headerShadowVisible: false,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                            <ArrowLeftIcon color={themeColors.primary} />
                        </TouchableOpacity>
                    ),
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    {/* Tarjeta de Habilitación */}
                    <DetailCard 
                        title="Datos de la Habilitación" 
                        headerAccessory={<StatusBadge estado={habilitacion.estado} themeColors={themeColors} styles={styles} />}
                    >
                        <InfoRow label="N° de Licencia" value={habilitacion.nro_licencia} icon={<FileTextIcon color={themeColors.primary} />} />
    {/* 👇 LÍNEA CORREGIDA: Ahora usa el ícono correcto */}
    <InfoRow label="Tipo de Transporte" value={habilitacion.tipo_transporte} icon={<CarIcon color={themeColors.primary} />} />
    <InfoRow label="Expediente" value={habilitacion.expte} icon={<FileTextIcon color={themeColors.primary} />} />
</DetailCard>

                    {/* Tarjeta de Titular */}
                    {titular && (
                        <DetailCard title="Datos del Titular">
                            <InfoRow label="Nombre Completo" value={titular.nombre} icon={<UserIcon color={themeColors.primary} />} />
                            <InfoRow label="DNI" value={titular.dni} icon={<UserIcon color={themeColors.primary} />} />
                        </DetailCard>
                    )}

                    {/* Tarjeta de Vehículo */}
                    {vehiculo && (
                        <DetailCard title="Datos del Vehículo">
                            <InfoRow label="Marca y Modelo" value={`${vehiculo.marca} ${vehiculo.modelo}`} icon={<CarIcon color={themeColors.primary} />} />
                            <InfoRow label="Dominio" value={vehiculo.dominio} icon={<CarIcon color={themeColors.primary} />} />
                        </DetailCard>
                    )}

                     {/* Tarjeta de Turno */}
                     {turno && (
                        <DetailCard title="Datos del Turno">
                            <InfoRow label="Fecha y Hora" value={turnoInfo} icon={<CalendarIcon color={themeColors.primary} />} />
                            <InfoRow label="Estado del Turno" value={turno.estado} icon={<CalendarIcon color={themeColors.primary} />} />
                        </DetailCard>
                    )}
                </View>
            </ScrollView>
<View style={styles.footer}>
    <TouchableOpacity 
        style={styles.actionButton} 
        onPress={() => router.push({
            pathname: '/(inspector)/inspection-form',
            params: { tramite: JSON.stringify(tramite) }
        })}
    >
        <Text style={styles.actionButtonText}>Iniciar Inspección</Text>
    </TouchableOpacity>
</View>
        </SafeAreaView>
    );
}


// --- Estilos ---
const getStyles = (colors: any) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { paddingHorizontal: 20, paddingBottom: 20 },
    scrollContent: { paddingVertical: 10 },
    headerBackButton: { padding: 10, marginLeft: 10 },
    card: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: 'rgba(0, 174, 239, 0.05)'
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primaryDark,
    },
    cardContent: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 16,
    },
    statusBadge: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    statusBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 174, 239, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoTextContainer: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        color: colors.grayMedium,
        marginBottom: 2,
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
    },
    actionButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});