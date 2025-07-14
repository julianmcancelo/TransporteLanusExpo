// app/(inspector)/inspecciones.tsx

/// <reference types="expo-router/types" />

import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
// Asumimos que tendrás estos endpoints en tu archivo de constantes

// --- Tipos e Íconos ---
type IconProps = { color: string };
const LogoutIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color} strokeWidth={2} /><Path d="M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth={2} /></Svg>;
const ChevronRightIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const FilePlusIcon = ({ color }: IconProps) => <Svg width={28} height={28} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth={2}/><Path d="M14 2v6h6M12 18v-6M9 15h6" stroke={color} strokeWidth={2}/></Svg>;
const ClockIcon = ({ color }: IconProps) => <Svg width={28} height={28} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2}/><Path d="M12 6v6l4 2" stroke={color} strokeWidth={2}/></Svg>;
const SendIcon = ({ color }: IconProps) => <Svg width={28} height={28} viewBox="0 0 24 24" fill="none"><Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke={color} strokeWidth={2}/></Svg>;
const WifiOffIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M1 1l22 22m-5-5a9 9 0 00-11-11M5 13a5 5 0 018-4m-3 9a1 1 0 11-2 0 1 1 0 012 0z" stroke={color} strokeWidth={2}/></Svg>;
const DownloadCloudIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M8 17l4 4 4-4M12 12v9" stroke={color} strokeWidth={2}/><Path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29" stroke={color} strokeWidth={2}/></Svg>;
const UploadCloudIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M12 2v10m0 0l4-4m-4 4L8 8" stroke={color} strokeWidth={2}/><Path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29" stroke={color} strokeWidth={2}/></Svg>;
const SunIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2"/><Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={color} strokeWidth="2" strokeLinecap="round"/></Svg>;


// --- Componentes de UI ---
const Clock = ({ styles }: { styles: any }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);
    const formatDate = (date: Date) => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
    };
    return (
        <View>
            <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
            <Text style={styles.timeText}>{currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
    );
};

const WeatherInfo = ({ styles, themeColors }: { styles: any, themeColors: any }) => (
    <View style={styles.weatherContainer}>
        <SunIcon color={themeColors.textLight} />
        <Text style={styles.weatherText}>24°C</Text>
    </View>
);

const AppHeader = ({ user, onLogout, themeColors, styles }: { user: any, onLogout: () => void, themeColors: any, styles: any }) => (
    <LinearGradient colors={[themeColors.primary, themeColors.primaryDark]} style={styles.appHeader}>
        <View style={styles.headerTopRow}>
            <Text style={styles.welcomeTitle}>Hola, {user?.nombre?.split(' ')[0] || 'Inspector'}</Text>
            <TouchableOpacity onPress={onLogout} style={styles.headerButton}>
                <LogoutIcon color={themeColors.textLight} />
            </TouchableOpacity>
        </View>
         <View style={styles.headerInfoContainer}>
            <Clock styles={styles} />
            <WeatherInfo styles={styles} themeColors={themeColors} />
        </View>
    </LinearGradient>
);

const ActionCard = ({ icon, title, subtitle, onPress, styles, fullWidth = false }: { icon: React.ReactNode, title: string, subtitle: string, onPress: () => void, styles: any, fullWidth?: boolean }) => (
    <TouchableOpacity onPress={onPress} style={[styles.actionCard, fullWidth ? styles.fullWidthCard : styles.halfWidthCard]}>
        <View style={styles.actionIcon}>{icon}</View>
        <View>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.actionChevron}><ChevronRightIcon color={styles.actionChevron.color} /></View>
    </TouchableOpacity>
);

// --- Pantalla Principal del Inspector ---
export default function InspectorScreen() {
    const { userSession, signOut } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = { ...Colors[colorScheme], primary: '#0093D2', primaryDark: '#007AB8' };
    const styles = getStyles(themeColors);

    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isPreparingOffline, setIsPreparingOffline] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPendingCount = useCallback(async () => {
        if (!userSession?.token) return;
        setIsLoading(true);
        try {
            // const response = await fetch(API_PENDING_COUNT_URL, { headers: { 'Authorization': `Bearer ${userSession.token}` } });
            // const result = await response.json();
            // if (result.status === 'success') {
            //     setPendingCount(result.count || 0);
            // } else {
            //     Alert.alert("Error", "No se pudo obtener el número de inspecciones pendientes.");
            // }
            // Simulación de API
            setTimeout(() => {
                setPendingCount(5);
                setIsLoading(false);
            }, 1000);
        } catch (error) {
            Alert.alert("Error de Red", "No se pudo conectar al servidor.");
            setIsLoading(false);
        }
    }, [userSession]);

    // CORRECCIÓN: Se envuelve la llamada a la función async en un useCallback
    useFocusEffect(
        useCallback(() => {
            fetchPendingCount();
        }, [fetchPendingCount])
    );

    const onSync = async () => {
        setIsSyncing(true);
        try {
            // const response = await fetch(API_SYNC_URL, { method: 'POST', headers: { 'Authorization': `Bearer ${userSession.token}` } });
            // const result = await response.json();
            // if (result.status === 'success') {
            //     Alert.alert("Éxito", "Las inspecciones han sido sincronizadas.");
            //     await fetchPendingCount(); // Refrescar el contador
            // } else {
            //     throw new Error(result.message || "Error al sincronizar.");
            // }
            // Simulación de API
            setTimeout(() => {
                Alert.alert("Éxito", "Las inspecciones han sido sincronizadas.");
                setPendingCount(0);
                setIsSyncing(false);
            }, 2000);
        } catch (error: any) {
            Alert.alert("Error de Sincronización", error.message);
            setIsSyncing(false);
        }
    };

    const prepareForOffline = () => {
        setIsPreparingOffline(true);
        setTimeout(() => {
            Alert.alert("Modo Offline", "Los datos se han guardado en el dispositivo.");
            setIsPreparingOffline(false);
        }, 2000);
    };

    const navigateToInspecciones = () => router.push('/(inspector)/nueva-inspeccion');
    const navigateToHistorySearch = () => router.push('/(inspector)/historial');
    const navigateToReportSending = () => console.log("Navegar a Envío de Reportes");

    return (
        <SafeAreaView style={styles.mainContainer}>
            <AppHeader user={userSession} onLogout={signOut} themeColors={themeColors} styles={styles} />
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeTitleText}>Panel de Inspector</Text>
                    <Text style={styles.welcomeSubtitle}>Selecciona una opción para comenzar</Text>
                </View>

                {isLoading ? (
                    <ActivityIndicator style={{ marginVertical: 20 }} size="small" color={themeColors.primary} />
                ) : pendingCount > 0 && (
                    <TouchableOpacity style={styles.syncCard} onPress={onSync} disabled={isSyncing}>
                        <View style={styles.syncIcon}>
                            {isSyncing ? <ActivityIndicator color="#FFF" /> : <UploadCloudIcon color="#FFF"/>}
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.syncCardTitle}>{isSyncing ? "Sincronizando..." : "Sincronización Pendiente"}</Text>
                            <Text style={styles.syncCardSubtitle}>Tienes {pendingCount} inspeccion(es) para enviar.</Text>
                        </View>
                        {!isSyncing && <ChevronRightIcon color="#FFF" />}
                    </TouchableOpacity>
                )}

                <View style={styles.grid}>
                    <ActionCard icon={<FilePlusIcon color={themeColors.primary} />} title="Nueva Inspección" subtitle="Comenzar un formulario" onPress={navigateToInspecciones} styles={styles} />
                    <ActionCard icon={<ClockIcon color={themeColors.primary} />} title="Consultar Historial" subtitle="Ver inspecciones pasadas" onPress={navigateToHistorySearch} styles={styles} />
                </View>
                
                <ActionCard icon={<SendIcon color={themeColors.primary} />} title="Envío de Reportes" subtitle="Enviar copia por email" onPress={navigateToReportSending} styles={styles} fullWidth />

                <View style={styles.separator} />

                <View style={styles.sectionHeader}>
                    <WifiOffIcon color={themeColors.text} />
                    <Text style={styles.sectionTitle}>Modo Offline</Text>
                </View>
                <TouchableOpacity style={styles.offlineButton} onPress={prepareForOffline} disabled={isPreparingOffline}>
                    {isPreparingOffline ? <ActivityIndicator color="#FFFFFF" /> : (
                        <>
                            <DownloadCloudIcon color="#FFFFFF" />
                            <Text style={styles.offlineButtonText}>Guardar Datos para Offline</Text>
                        </>
                    )}
                </TouchableOpacity>
                <Text style={styles.offlineDescription}>Guarda los datos de tu sesión y la última lista de habilitaciones para trabajar sin conexión.</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

// --- Estilos Dinámicos ---
const getStyles = (colors: any) => StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: colors.background },
    container: { paddingVertical: 20, paddingBottom: 40 },
    appHeader: { paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 20, paddingHorizontal: 24 },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    welcomeTitle: { fontSize: 28, fontWeight: 'bold', color: colors.textLight },
    headerButton: { marginLeft: 16, padding: 8, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 99 },
    headerInfoContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.2)' },
    dateText: { fontSize: 16, color: colors.textLight, fontWeight: '600' },
    timeText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' },
    weatherContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    weatherText: { fontSize: 18, color: colors.textLight, fontWeight: 'bold' },
    welcomeSection: { marginBottom: 25, paddingHorizontal: 20 },
    welcomeTitleText: { fontSize: 28, fontWeight: 'bold', color: colors.text },
    welcomeSubtitle: { fontSize: 16, color: colors.grayMedium, marginTop: 4 },
    syncCard: { backgroundColor: colors.warning, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginHorizontal: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
    syncIcon: { marginRight: 15, backgroundColor: 'rgba(255,255,255,0.2)', width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22 },
    syncCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
    syncCardSubtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.9)', marginTop: 2 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
    actionCard: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: colors.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    halfWidthCard: { width: '48%' },
    fullWidthCard: { marginHorizontal: 20 },
    actionIcon: { marginBottom: 12 },
    actionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    actionSubtitle: { fontSize: 13, color: colors.grayMedium, marginTop: 4 },
    actionChevron: { position: 'absolute', top: 15, right: 15, color: colors.grayMedium },
    separator: { height: 1, backgroundColor: colors.border, marginVertical: 25, marginHorizontal: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginLeft: 10 },
    offlineButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primaryDark, paddingVertical: 15, borderRadius: 12, gap: 10, marginHorizontal: 20, elevation: 3 },
    offlineButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    offlineDescription: { fontSize: 13, color: colors.grayMedium, textAlign: 'center', marginTop: 12, paddingHorizontal: 30 },
});
