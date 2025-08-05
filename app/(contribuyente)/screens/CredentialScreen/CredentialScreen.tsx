// app/credential.tsx

/// <reference types="expo-router/types" />

import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';

import { API_CREDENTIAL_DETAILS_URL, CREDENCIAL_VERIFY_URL } from '@/constants/api';
import { Colors } from '@/constants/Colors';

// --- DEFINICIÓN DE TIPOS ---
interface CredentialData {
  token: string;
  estado: string;
  titular_nombre: string;
  titular_dni: string;
  nro_licencia: string;
  tipo_transporte: string;
  expte: string;
  vigencia_inicio: string;
  vigencia_fin: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: string;
  asientos: string;
  conductor_nombre?: string;
  celador_nombre?: string;
  escuela_nombre?: string;
  remiseria_nombre?: string;
}

type IconProps = { color: string; };
type DetailRowProps = {
    icon: React.ReactNode;
    label: string;
    value?: string | null;
    styles: ReturnType<typeof getStyles>;
};

// --- ICONOS ---
const BackIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const ErrorIcon = ({ color }: IconProps) => <Svg width={64} height={64} viewBox="0 0 24 24" fill="none"><Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth={1.5} /></Svg>;
const UserPlaceholderIcon = () => <Svg width={60} height={60} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={'#FFF'} strokeOpacity={0.7} strokeWidth="1.5"/><Circle cx="12" cy="7" r="4" stroke={'#FFF'} strokeOpacity={0.7} strokeWidth="1.5"/></Svg>;
const CarIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M14 16.67H9.33a1 1 0 01-1-1V12.33a1 1 0 011-1H14a1 1 0 011 1v3.34a1 1 0 01-1 1z" stroke={color} strokeWidth="2" /><Path d="M10.33 11.33V8.83a2 2 0 012-2h0a2 2 0 012 2v2.5M17.5 16.67h1a1 1 0 001-1V10.83a3 3 0 00-3-3H7.5a3 3 0 00-3 3v4.84a1 1 0 001 1h1m9 0v2m-9-2v2" stroke={color} strokeWidth="2" /></Svg>;
const FileTextIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" /><Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" /></Svg>;
const CalendarIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2"/><Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" /></Svg>;
const UsersIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" /><Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" /><Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" /></Svg>;
const BuildingIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M3 21h18M5 21V7l8-4 8 4v14M11 21v-5a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1v5" stroke={color} strokeWidth="2" /></Svg>;

// --- COMPONENTE DE PATRÓN DE FONDO ---
const SubtleGridPattern = ({ color }: { color: string }) => (
  <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
    <Defs>
      <Pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <Path d="M 20 0 L 0 0 0 20" fill="none" stroke={color} strokeWidth="0.5" opacity="0.2"/>
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#grid)" />
  </Svg>
);

// --- COMPONENTES DE UI ---
const DetailRow = ({ icon, label, value, styles }: DetailRowProps) => {
    if (!value) return null;
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIcon}>{icon}</View>
            <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode='tail'>{value}</Text>
            </View>
        </View>
    );
};

const CredentialView = ({ data, themeColors, styles }: { data: CredentialData, themeColors: any, styles: any }) => {
    const qrValue = `${CREDENCIAL_VERIFY_URL}?token=${data.token}`;
    const getStatusStyle = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'vigente': return { color: themeColors.success, text: 'HABILITACIÓN VIGENTE' };
            case 'en tramite': return { color: themeColors.warning, text: 'HABILITACIÓN EN TRÁMITE' };
            case 'vencido': return { color: themeColors.error, text: 'HABILITACIÓN VENCIDA' };
            default: return { color: themeColors.grayMedium, text: (status || 'Desconocido').toUpperCase() };
        }
    };
    const statusInfo = getStatusStyle(data.estado);
    
    return (
        <View style={styles.cardContainer}>
            <LinearGradient colors={[themeColors.primary, themeColors.primaryDark]} style={styles.cardHeader}>
                <Image source={{ uri: 'https://api.transportelanus.com.ar/logo2.png' }} style={styles.logo} resizeMode="contain"/>
                <Text style={styles.headerTitle}>CREDENCIAL DE TRANSPORTE</Text>
                <Text style={styles.headerSubtitle}>MUNICIPIO DE LANÚS</Text>
            </LinearGradient>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <UserPlaceholderIcon />
                    </View>
                    <Text style={styles.profileName}>{data.titular_nombre || 'Nombre no disponible'}</Text>
                    <Text style={styles.profileDni}>DNI: {data.titular_dni || 'N/A'}</Text>
                </View>

                <View style={styles.qrSection}>
                    <View style={styles.qrBackground}>
                        {data.token ? <QRCode value={qrValue} size={150} backgroundColor='white' color={themeColors.text} /> : <Text>No se pudo generar el QR.</Text>}
                    </View>
                </View>
                
                <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>Habilitación</Text>
                    <DetailRow styles={styles} icon={<FileTextIcon color={themeColors.primary}/>} label="Licencia N°" value={data.nro_licencia} />
                    <DetailRow styles={styles} icon={<CarIcon color={themeColors.primary}/>} label="Tipo de Transporte" value={data.tipo_transporte} />
                    <DetailRow styles={styles} icon={<FileTextIcon color={themeColors.primary}/>} label="Expediente" value={data.expte} />
                    <DetailRow styles={styles} icon={<CalendarIcon color={themeColors.primary}/>} label="Vigencia" value={`${data.vigencia_inicio || 'N/A'} al ${data.vigencia_fin || 'N/A'}`} />
                </View>

                <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>Vehículo</Text>
                    <DetailRow styles={styles} icon={<CarIcon color={themeColors.primary}/>} label="Dominio" value={data.patente} />
                    <DetailRow styles={styles} icon={<CarIcon color={themeColors.primary}/>} label="Marca / Modelo" value={`${data.marca || ''} / ${data.modelo || ''}`} />
                    <DetailRow styles={styles} icon={<CalendarIcon color={themeColors.primary}/>} label="Año" value={data.anio} />
                    <DetailRow styles={styles} icon={<UsersIcon color={themeColors.primary}/>} label="Asientos" value={data.asientos} />
                </View>
                
                {(data.conductor_nombre || data.celador_nombre) && (
                    <View style={styles.detailsSection}>
                        <Text style={styles.sectionTitle}>Personal Adicional</Text>
                        <DetailRow styles={styles} icon={<UsersIcon color={themeColors.primary}/>} label="Conductor" value={data.conductor_nombre} />
                        <DetailRow styles={styles} icon={<UsersIcon color={themeColors.primary}/>} label="Celador" value={data.celador_nombre} />
                    </View>
                )}

                {(data.escuela_nombre || data.remiseria_nombre) && (
                     <View style={styles.detailsSection}>
                         <Text style={styles.sectionTitle}>Entidad Asociada</Text>
                         <DetailRow styles={styles} icon={<BuildingIcon color={themeColors.primary}/>} label="Establecimiento" value={data.escuela_nombre} />
                         <DetailRow styles={styles} icon={<BuildingIcon color={themeColors.primary}/>} label="Remisería" value={data.remiseria_nombre} />
                     </View>
                )}
            </ScrollView>

            <View style={[styles.cardFooter, { backgroundColor: statusInfo.color }]}>
                <Text style={styles.footerText}>{statusInfo.text}</Text>
            </View>
        </View>
    );
};

// --- PANTALLA PRINCIPAL ---
export default function CredentialScreen() {
    const router = useRouter();
    const { licenseToken } = useLocalSearchParams<{ licenseToken: string }>();
    const colorScheme = useColorScheme() ?? 'light';
    
    const lanusTheme = {
      ...Colors[colorScheme],
      primary: '#0093D2',
      primaryDark: '#007AB8',
    };

    const themeColors = lanusTheme;
    const styles = getStyles(themeColors);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [credentialData, setCredentialData] = useState<CredentialData | null>(null);
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const fetchCredentialDetails = async () => {
            if (!licenseToken) {
                setError("No se proporcionó un token de licencia válido.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(API_CREDENTIAL_DETAILS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ token: licenseToken }),
                });
                const result = await response.json();
                if (response.ok && result.status === 'success') {
                    setCredentialData(result.data);
                    Animated.parallel([
                      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 40, friction: 7 }),
                      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true })
                    ]).start();
                } else {
                    throw new Error(result.message || "No se pudieron cargar los datos.");
                }
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCredentialDetails();
    }, [licenseToken, opacityAnim, scaleAnim]);

    const renderContent = () => {
        if (isLoading) {
            return <ActivityIndicator size="large" color={themeColors.primary} />;
        }
        if (error) {
            return (
                <View style={styles.messageContainer}>
                    <ErrorIcon color={themeColors.error} />
                    <Text style={styles.errorTitle}>Acceso Denegado</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                </View>
            );
        }
        if (credentialData) {
            return (
              <Animated.View style={{flex: 1, width: '100%', opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
                <CredentialView data={credentialData} themeColors={themeColors} styles={styles} />
              </Animated.View>
            );
        }
        return null;
    };

    return (
        <SafeAreaView style={styles.container}>
             <LinearGradient colors={['#FFFFFF', '#ECEFF1']} style={StyleSheet.absoluteFill} />
             <SubtleGridPattern color={themeColors.grayMedium} />
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <BackIcon color={themeColors.textLight} />
            </TouchableOpacity>
            <View style={styles.content}>
                {renderContent()}
            </View>
        </SafeAreaView>
    );
};

// --- ESTILOS DINÁMICOS ---
const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backButton: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 99 },
    cardContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: colors.cardBackground,
    },
    cardHeader: { paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 20, alignItems: 'center' },
    logo: { height: 100, width: 100, marginBottom: 12 },
    headerTitle: { color: colors.textLight, fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
    headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    profileSection: { alignItems: 'center', marginTop: -50, marginBottom: 15, paddingHorizontal: 10 },
    avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primaryDark, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: colors.cardBackground, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 10 },
    profileName: {
        marginTop: 12,
        fontSize: 26,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center'
    },
    profileDni: { fontSize: 16, color: colors.grayMedium },
    scrollContent: { paddingBottom: 20 },
    qrSection: { alignItems: 'center', paddingVertical: 20 },
    qrBackground: { backgroundColor: 'white', padding: 12, borderRadius: 18, borderWidth: 1, borderColor: `${colors.icon}20` },
    detailsSection: {
        paddingHorizontal: 24,
        marginVertical: 15,
    },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.primary, textTransform: 'uppercase', marginBottom: 10, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: `${colors.icon}20` },
    detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: `${colors.icon}20` },
    detailIcon: { marginRight: 15 },
    detailTextContainer: { flex: 1 },
    detailLabel: { fontSize: 12, color: colors.grayMedium, textTransform: 'uppercase' },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text
    },
    cardFooter: { paddingVertical: 20, alignItems: 'center' },
    footerText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
    messageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorTitle: { fontSize: 22, fontWeight: 'bold', color: colors.error, marginTop: 16, marginBottom: 8 },
    errorMessage: { fontSize: 16, color: colors.grayMedium, textAlign: 'center', marginBottom: 24 },
});
