// =========================================================================
// ARCHIVO: app/(inspector)/inspeccion-detalle.tsx (v2.0 - Reescritura Completa)
// DESCRIPCIÓN: Muestra el detalle de la habilitación y el resultado de la inspección.
// =========================================================================

import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Vehiculo } from '../../src/types/habilitacion';
import { useAuth } from '../../src/contexts/AuthContext';
import { API_CREDENTIAL_DETAILS_URL } from '../../src/constants/api';
import AppHeader from '../../components/ui/AppHeader';
import { useTheme } from '../../src/hooks/useTheme';

// --- Tipos ---
interface Habilitacion {
    id: number;
    nro_licencia: string;
    estado: 'VIGENTE' | 'VENCIDA' | 'EN TRAMITE' | 'INICIADO' | string;
    tipo_transporte: string;
    vigencia_fin: string;
    is_deleted: number;
}
interface Titular { 
    nombre: string; 
    email: string;
    telefono: string;
}
interface Inspection {
    estado: 'finalizado' | 'pendiente' | string;
    resultado: 'aprobado' | 'rechazado' | null;
}
interface Turno { 
    id: number;
    fecha: string; 
    hora: string; 
    estado: 'PENDIENTE' | 'CONFIRMADO' | 'COMPLETADO' | string; 
}
interface Tramite {
    habilitacion: Habilitacion;
    titular: Titular | null;
    vehiculo: Vehiculo | null;
    turno: Turno | null;
    inspection?: Inspection;
}
type IconProps = { color: string, size?: number };

// --- Estilos y Colores ---
const getStyles = (colors: any) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { paddingHorizontal: 20, paddingBottom: 20 },
    scrollContent: { paddingVertical: 10 },
    headerBackButton: { padding: 10, marginLeft: 10 },
    card: { backgroundColor: colors.cardBackground, borderRadius: 16, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 5 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: 'rgba(0, 174, 239, 0.05)' },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primaryDark },
    cardContent: { paddingHorizontal: 20, paddingVertical: 10, gap: 16 },
    statusBadge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20 },
    statusBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    infoIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 174, 239, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    infoTextContainer: { flex: 1 },
    label: { fontSize: 14, color: colors.grayMedium, marginBottom: 2 },
    value: { fontSize: 16, fontWeight: '500', color: colors.text },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
    actionButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    actionButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    badgeAprobado: { backgroundColor: colors.success },
    badgeRechazado: { backgroundColor: colors.error },
    badgePendiente: { backgroundColor: colors.warning },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10 }, 
});

// --- Iconos ---
const ArrowLeftIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const UserIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const CarIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M14 16.67H9.33a1 1 0 01-1-1V12.33a1 1 0 011-1H14a1 1 0 011 1v3.34a1 1 0 01-1 1z" stroke={color} strokeWidth="2" /><Path d="M10.33 11.33V8.83a2 2 0 012-2h0a2 2 0 012 2v2.5M17.5 16.67h1a1 1 0 001-1V10.83a3 3 0 00-3-3H7.5a3 3 0 00-3 3v4.84a1 1 0 001 1h1m9 0v2m-9-2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const CalendarIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M8 2v4M16 2v4M3 10h18M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const FileTextIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;

// --- Componentes Reutilizables ---
const InfoRow = ({ label, value, icon }: { label: string, value?: string | null, icon: React.ReactNode }) => {
    const { colors } = useTheme();
    const styles = getStyles(colors);
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
    const { colors } = useTheme();
    const styles = getStyles(colors);
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

const HabilitacionStatusBadge = ({ estado, colors }: { estado: Habilitacion['estado'], colors: any }) => {
    const styles = getStyles(colors);
    const statusInfo = useMemo(() => ({
        'VIGENTE': { color: colors.success, label: 'Vigente' },
        'VENCIDA': { color: colors.error, label: 'Vencida' },
        'EN TRAMITE': { color: colors.warning, label: 'En Trámite' },
        'INICIADO': { color: colors.primary, label: 'Iniciado' },
    }), [colors]);
    const currentStatus = statusInfo[estado as keyof typeof statusInfo] || { color: colors.grayMedium, label: estado };
    return (
        <View style={[styles.statusBadge, { backgroundColor: currentStatus.color }]}>
            <Text style={styles.statusBadgeText}>{currentStatus.label}</Text>
        </View>
    );
};

const InspectionStatusBadge = ({ inspection, colors }: { inspection: Inspection, colors: any }) => {
    const styles = getStyles(colors);
    const isFinalizado = inspection.estado === 'finalizado';
    const isAprobado = inspection.resultado === 'aprobado';

    let badgeStyle: object = styles.badgePendiente;
    let badgeText = inspection.estado;

    if (isFinalizado) {
        if (isAprobado) {
            badgeStyle = styles.badgeAprobado;
            badgeText = 'Aprobado';
        } else {
            badgeStyle = styles.badgeRechazado;
            badgeText = 'Rechazado';
        }
    }

    return (
        <View style={[styles.statusBadge, badgeStyle]}>
            <Text style={styles.statusBadgeText}>{badgeText}</Text>
        </View>
    );
};

// --- Pantalla Principal ---
export default function InspeccionDetalleScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, colorScheme } = useTheme();
    const styles = getStyles(colors);

    const { session: user, signOut } = useAuth();
    const [tramite, setTramite] = useState<Tramite | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchInspectionDetails = async () => {
                if (!params.tramite || typeof params.tramite !== 'string') return;

                let initialTramiteData;
                try {
                    initialTramiteData = JSON.parse(params.tramite);
                } catch (error) {
                    console.error("Error parsing initial tramite data:", error);
                    setIsLoading(false);
                    return;
                }

                const habilitacionId = initialTramiteData?.habilitacion?.id;
                if (!habilitacionId || !user?.token) {
                    setTramite(initialTramiteData); // Fallback to initial data
                    setIsLoading(false);
                    return;
                }

                setIsLoading(true);
                try {
                    const response = await fetch(API_CREDENTIAL_DETAILS_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${user.token}`,
                        },
                        body: JSON.stringify({ 
                            habilitacion_id: habilitacionId
                        })
                    });
                    const data = await response.json();
                    if (response.ok && data.success) {
                        setTramite(data.data);
                    } else {
                        console.error("Failed to fetch details:", data.message);
                        setTramite(initialTramiteData); // Fallback to initial data on API error
                    }
                } catch (error) {
                    console.error("Error fetching inspection details:", error);
                    setTramite(initialTramiteData); // Fallback on network error
                } finally {
                    setIsLoading(false);
                }
            };

            fetchInspectionDetails();
        }, [params.tramite, user?.token])
    );

    // Android-specific container style to ensure content is below status bar
    const androidContainerStyle = {
        flex: 1,
        backgroundColor: colors.background,
        ...(Platform.OS === 'android' && {
            paddingTop: StatusBar.currentHeight || 0,
        })
    };

    if (isLoading) {
        return (
            <View style={androidContainerStyle}>
                <StatusBar 
                    barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
                    backgroundColor={colors.background} 
                    translucent={false}
                />
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Actualizando datos...</Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    if (!tramite) {
        return (
            <View style={androidContainerStyle}>
                <StatusBar 
                    barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
                    backgroundColor={colors.background} 
                    translucent={false}
                />
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando datos...</Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    const { habilitacion, titular, vehiculo, turno, inspection } = tramite;
    const turnoInfo = turno ? `${new Date(turno.fecha + 'T00:00:00').toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: 'numeric'})} a las ${turno.hora.substring(0, 5)} hs` : 'Sin datos';

    return (
        <View style={androidContainerStyle}>
            <StatusBar 
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
                backgroundColor={colors.background} 
                translucent={false}
            />
            <SafeAreaView style={styles.safeArea}>
                <AppHeader user={user} onLogout={signOut} />
                <Stack.Screen
                    options={{
                        title: `Licencia ${habilitacion.nro_licencia}`,
                        headerStyle: { backgroundColor: colors.background },
                        headerTitleStyle: { color: colors.text, fontWeight: 'bold' },
                        headerShadowVisible: false,
                        headerLeft: () => (
                            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                                <ArrowLeftIcon color={colors.primary} />
                            </TouchableOpacity>
                        ),
                    }}
                />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    {inspection && (
                        <DetailCard title="Resultado de la Inspección">
                            <View style={{alignItems: 'center'}}><InspectionStatusBadge inspection={inspection} colors={colors} /></View>
                        </DetailCard>
                    )}
                    <DetailCard title="Datos de la Habilitación" headerAccessory={<HabilitacionStatusBadge estado={habilitacion.estado} colors={colors} />}>
                        <InfoRow label="N° de Licencia" value={habilitacion.nro_licencia} icon={<FileTextIcon color={colors.primary} />} />
                        <InfoRow label="Tipo de Transporte" value={habilitacion.tipo_transporte} icon={<CarIcon color={colors.primary} />} />
                        <InfoRow label="Vigencia" value={habilitacion.vigencia_fin} icon={<CalendarIcon color={colors.primary} />} />
                    </DetailCard>
                    {titular && (
                        <DetailCard title="Datos del Titular">
                            <InfoRow label="Nombre Completo" value={titular.nombre} icon={<UserIcon color={colors.primary} />} />
                            <InfoRow label="Email" value={titular.email} icon={<UserIcon color={colors.primary} />} />
                            <InfoRow label="Teléfono" value={titular.telefono} icon={<UserIcon color={colors.primary} />} />
                        </DetailCard>
                    )}
                    {vehiculo && (
                        <DetailCard title="Datos del Vehículo">
                            <InfoRow label="Marca y Modelo" value={`${vehiculo.marca} ${vehiculo.modelo}`} icon={<CarIcon color={colors.primary} />} />
                            <InfoRow label="Dominio" value={vehiculo.dominio} icon={<CarIcon color={colors.primary} />} />
                        </DetailCard>
                    )}
                    {turno && (
                        <DetailCard title="Datos del Turno">
                            <InfoRow label="Fecha y Hora" value={turnoInfo} icon={<CalendarIcon color={colors.primary} />} />
                            <InfoRow label="Estado del Turno" value={turno.estado} icon={<CalendarIcon color={colors.primary} />} />
                        </DetailCard>
                    )}
                </View>
            </ScrollView>
            <View style={styles.footer}>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push({ pathname: '/(inspector)/inspection-form', params: { tramite: JSON.stringify(tramite) } })}>
                    <Text style={styles.actionButtonText}>Iniciar Inspección</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
        </View>
    );
}
