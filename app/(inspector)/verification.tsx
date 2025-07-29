// =========================================================================
// ARCHIVO: app/(inspector)/verificacion.tsx (Versión Final y Corregida)
// Recibe, muestra todos los datos del trámite y navega al formulario.
// Estética y responsividad mejoradas para una mejor experiencia de usuario.
// =========================================================================
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';

// --- Tipos de Datos Completos ---
interface Habilitacion {
    id: string;
    nro_licencia: string;
    estado: 'Vigente' | 'Vencida' | 'En Proceso' | string; // Permitimos otros strings por si acaso
    tipo_transporte: string;
    expte: string;
}
interface Titular {
    nombre: string;
    dni: string;
}
import type { Vehiculo } from '../../src/types/habilitacion';
interface Turno {
    fecha: string;
    hora: string;
    estado: string;
}
interface Tramite {
    habilitacion: Habilitacion;
    titular: Titular | null;
    vehiculo: Vehiculo | null;
    turno: Turno | null;
}

// --- Iconos ---
const UserIcon = ({ color }: { color: string }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const CarIcon = ({ color }: { color: string }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M14 16.67H9.33a1 1 0 01-1-1V12.33a1 1 0 011-1H14a1 1 0 011 1v3.34a1 1 0 01-1 1z" stroke={color} strokeWidth="2" /><Path d="M10.33 11.33V8.83a2 2 0 012-2h0a2 2 0 012 2v2.5M17.5 16.67h1a1 1 0 001-1V10.83a3 3 0 00-3-3H7.5a3 3 0 00-3 3v4.84a1 1 0 001 1h1m9 0v2m-9-2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const CalendarIcon = ({ color }: { color: string }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M8 2v4M16 2v4M3 10h18M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const FileTextIcon = ({ color }: { color: string }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const CheckCircleIcon = ({ color }: { color: string }) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><Path d="M22 4L12 14.01l-3-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const ArrowLeftIcon = ({ color }: { color: string }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>;

// --- Componente de Fila de Información ---
const InfoRow = ({ label, value, icon, styles }: { label: string, value: string | undefined | null, icon: React.ReactNode, styles: any }) => {
    if (!value || value.trim() === '') return null;
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>{icon}</View>
            <View style={styles.infoTextContainer}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
            </View>
        </View>
    );
};

// --- Componente de Tarjeta de Sección ---
const SectionCard = ({ title, children, styles }: { title: string, children: React.ReactNode, styles: any }) => (
    <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.cardContent}>
            {children}
        </View>
    </View>
);

// --- Componente de Badge de Estado ---
const StatusBadge = ({ estado, themeColors, styles }: { estado: Habilitacion['estado'], themeColors: any, styles: any }) => {
    const statusInfo = {
        Vigente: { color: themeColors.success, label: 'Vigente' },
        Vencida: { color: themeColors.error, label: 'Vencida' },
        'En Proceso': { color: themeColors.warning, label: 'En Proceso' },
    };
    const currentStatus = statusInfo[estado as keyof typeof statusInfo] || { color: themeColors.grayMedium, label: estado };

    return (
        <View style={[styles.statusBadge, { backgroundColor: currentStatus.color }]}>
            <Text style={styles.statusBadgeText}>{currentStatus.label}</Text>
        </View>
    );
};


const VerificationScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const tramite: Tramite | null = params.tramite ? JSON.parse(params.tramite as string) : null;
    
    // --- Paleta de colores "Celeste" ---
    const themeColors = {
        ...Colors['light'],
        primary: '#00AEEF', // Celeste principal
        primaryDark: '#008ACD', // Celeste oscuro
    };

    const styles = getStyles(themeColors);

    if (!tramite) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>Error: No se recibieron los datos del trámite.</Text>
                <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Volver</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen 
                options={{ 
                    title: `Verificación`,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: themeColors.background },
                    headerTitleStyle: {
                        color: themeColors.text,
                        fontWeight: 'bold',
                        fontSize: 18,
                    },
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                            <ArrowLeftIcon color={themeColors.primary} />
                        </TouchableOpacity>
                    ),
                }} 
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.header}>
                    <Text style={styles.headerLicencia}>Licencia {tramite.habilitacion.nro_licencia}</Text>
                    <StatusBadge estado={tramite.habilitacion.estado} themeColors={themeColors} styles={styles} />
                </View>

                <SectionCard title="Datos del Titular" styles={styles}>
                    <InfoRow label="Nombre Completo" value={tramite.titular?.nombre} icon={<UserIcon color={themeColors.primary} />} styles={styles} />
                    <InfoRow label="Documento" value={tramite.titular?.dni} icon={<FileTextIcon color={themeColors.primary} />} styles={styles} />
                </SectionCard>

                <SectionCard title="Datos del Vehículo" styles={styles}>
                    <InfoRow label="Dominio" value={tramite.vehiculo?.dominio} icon={<CarIcon color={themeColors.primary} />} styles={styles} />
                    <InfoRow label="Marca y Modelo" value={`${tramite.vehiculo?.marca || ''} ${tramite.vehiculo?.modelo || ''}`.trim()} icon={<CarIcon color={themeColors.primary} />} styles={styles} />
                </SectionCard>

                <SectionCard title="Datos de la Habilitación" styles={styles}>
                    <InfoRow label="Tipo de Transporte" value={tramite.habilitacion.tipo_transporte} icon={<CarIcon color={themeColors.primary} />} styles={styles} />
                    <InfoRow label="Expediente" value={tramite.habilitacion.expte} icon={<FileTextIcon color={themeColors.primary} />} styles={styles} />
                </SectionCard>

                {tramite.turno && (
                    <SectionCard title="Turno Asignado" styles={styles}>
                        <InfoRow label="Fecha" value={new Date(tramite.turno.fecha + 'T00:00:00').toLocaleDateString('es-AR')} icon={<CalendarIcon color={themeColors.primary} />} styles={styles} />
                        <InfoRow label="Hora" value={`${tramite.turno.hora.substring(0, 5)} hs`} icon={<CalendarIcon color={themeColors.primary} />} styles={styles} />
                    </SectionCard>
                )}

            </ScrollView>
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        router.push({
                            pathname: '/(inspector)/inspection-form', // Ruta actualizada al formulario
                            params: { tramite: JSON.stringify(tramite) },
                        });
                    }}
                >
                    <LinearGradient
                        colors={[themeColors.primary, themeColors.primaryDark]}
                        style={styles.buttonGradient}
                    >
                        <CheckCircleIcon color="#FFF" />
                        <Text style={styles.buttonText}>Comenzar Inspección</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const getStyles = (themeColors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: themeColors.background,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120, // Espacio para el footer
    },
    header: {
        marginBottom: 24,
    },
    headerBackButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    headerLicencia: {
        fontSize: 32,
        fontWeight: 'bold',
        color: themeColors.text,
        textAlign: 'center',
    },
    statusBadge: {
        alignSelf: 'center',
        marginTop: 12,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    statusBadgeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: themeColors.cardBackground,
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: themeColors.border,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: themeColors.primaryDark,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: 'rgba(0, 174, 239, 0.05)', // Tono celeste muy claro
    },
    cardContent: {
        padding: 20,
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 174, 239, 0.1)', // Tono celeste claro
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoTextContainer: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        color: themeColors.grayMedium,
    },
    value: {
        fontSize: 18,
        fontWeight: '500',
        color: themeColors.text,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        backgroundColor: themeColors.cardBackground,
        borderTopWidth: 1,
        borderTopColor: themeColors.border,
    },
    button: {
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        textAlign: 'center',
        fontSize: 18,
        marginTop: 50,
        paddingHorizontal: 20,
    },
});

export default VerificationScreen;
