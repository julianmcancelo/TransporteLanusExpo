import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetInfoState, useNetInfo } from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, LayoutAnimation, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View, useColorScheme } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

// --- Configuración para LayoutAnimation ---
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Tipos de Datos ---
interface Inspection {
  id: string;
  location: string;
  date: string;
  status: 'pending' | 'syncing' | 'synced';
}
const INSPECTIONS_STORAGE_KEY = '@inspections_data';
const OFFLINE_DATA_KEY = '@offline_prepared_data';


// --- Iconos SVG ---
type IconProps = { color: string };
const LogoutIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const ChevronRightIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const FilePlusIcon = ({ color }: IconProps) => <Svg width={28} height={28} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M14 2v6h6M12 18v-6M9 15h6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const ClockIcon = ({ color }: IconProps) => <Svg width={28} height={28} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M12 6v6l4 2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const SendIcon = ({ color }: IconProps) => <Svg width={28} height={28} viewBox="0 0 24 24" fill="none"><Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const WifiIcon = ({ color }: IconProps) => <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d="M5 13a7 7 0 0114 0M9 17a3 3 0 016 0" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M2 9a15 15 0 0120 0" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const WifiOffIcon = ({ color }: IconProps) => <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d="M1 1l22 22m-5-5a9 9 0 00-11-11M5 13a5 5 0 018-4m-3 9a1 1 0 11-2 0 1 1 0 012 0z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const DownloadCloudIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M8 17l4 4 4-4M12 12v9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const UploadCloudIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M16 16l-4-4-4 4M12 12v9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const TagIcon = ({ color }: IconProps) => <Svg width={28} height={28} viewBox="0 0 24 24" fill="none"><Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L3 13V4h9l7.59 7.59a2 2 0 010 2.82z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M7 7h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;


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

const ConnectionStatus = ({ isConnected, styles }: { isConnected: boolean | null, styles: any }) => {
    if (isConnected === null) return null;
    const statusStyles = isConnected ? styles.onlinePill : styles.offlinePill;
    return (
        <View style={[styles.connectionPill, statusStyles]}>
            {isConnected ? <WifiIcon color="white" /> : <WifiOffIcon color="white" />}
            <Text style={styles.connectionPillText}>{isConnected ? 'Online' : 'Offline'}</Text>
        </View>
    );
};

const OfflineDataStatus = ({ status, styles }: { status: string | null, styles: any }) => {
    const hasData = !!status;
    const containerStyle = hasData ? styles.offlineStatusContainerSuccess : styles.offlineStatusContainerEmpty;
    
    let content;
    if (hasData) {
        const date = new Date(status);
        const formattedDate = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const formattedTime = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        content = `Última actualización: ${formattedDate} a las ${formattedTime} hs.`;
    } else {
        content = "No hay datos guardados para modo offline.";
    }

    return (
        <View style={containerStyle}>
            <Text style={styles.offlineStatusText}>{content}</Text>
        </View>
    );
};


const AppHeader = ({ user, onLogout, netInfo, themeColors, styles }: { user: any, onLogout: () => void, netInfo: NetInfoState, themeColors: any, styles: any }) => (
    <LinearGradient colors={[themeColors.primary, themeColors.primaryDark]} style={styles.appHeader}>
        <View style={styles.headerTopRow}>
            <Text style={styles.welcomeTitle}>Hola, {user?.nombre?.split(' ')[0] || 'Inspector'}</Text>
            <TouchableOpacity onPress={onLogout} style={styles.headerButton}>
                <LogoutIcon color={themeColors.textLight} />
            </TouchableOpacity>
        </View>
         <View style={styles.headerInfoContainer}>
            <Clock styles={styles} />
            <ConnectionStatus isConnected={netInfo.isConnected} styles={styles} />
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
    const netInfo = useNetInfo();

    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isUpdatingOfflineData, setIsUpdatingOfflineData] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPerformedInitialCache, setHasPerformedInitialCache] = useState(false);
    const [offlineDataStatus, setOfflineDataStatus] = useState<string | null>(null);

    const cacheOfflineData = useCallback(async (isAutomatic: boolean = false) => {
        if (!isAutomatic) setIsUpdatingOfflineData(true);
        try {
            const preparedAt = new Date().toISOString();
            await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify({ preparedAt, user: userSession }));
            setOfflineDataStatus(preparedAt);
            if (!isAutomatic) Alert.alert("Datos Actualizados", "Los datos para trabajar sin conexión han sido actualizados.");
        } catch (error) {
            if (!isAutomatic) Alert.alert("Error", "No se pudieron guardar los datos para el modo offline.");
            console.error("Error en cacheOfflineData:", error);
        } finally {
            if (!isAutomatic) setIsUpdatingOfflineData(false);
        }
    }, [userSession]);

    const loadDataFromStorage = useCallback(async () => {
        setIsLoading(true);
        try {
            const storedInspections = await AsyncStorage.getItem(INSPECTIONS_STORAGE_KEY);
            const loadedInspections: Inspection[] = storedInspections ? JSON.parse(storedInspections) : [];
            const correctedInspections = loadedInspections.map(insp => insp.status === 'syncing' ? { ...insp, status: 'pending' as const } : insp);
            setInspections(correctedInspections);
            setPendingCount(correctedInspections.filter(i => i.status === 'pending').length);

            const storedOfflineData = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
            if (storedOfflineData) {
                const parsedData = JSON.parse(storedOfflineData);
                setOfflineDataStatus(parsedData.preparedAt);
            }
        } catch (error) {
            console.error("Error cargando datos:", error);
            Alert.alert("Error", "No se pudieron cargar los datos locales.");
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useFocusEffect(useCallback(() => { loadDataFromStorage(); }, [loadDataFromStorage]));

    useEffect(() => {
        if (netInfo.isConnected && !hasPerformedInitialCache && !isLoading) {
            setHasPerformedInitialCache(true);
            cacheOfflineData(true);
        }
    }, [netInfo.isConnected, isLoading, hasPerformedInitialCache, cacheOfflineData]);

    const onSync = useCallback(async () => {
        if (!netInfo.isConnected) {
            Alert.alert("Sin Conexión", "No puedes sincronizar sin una conexión a internet.");
            return;
        }
        const pendingInspections = inspections.filter(i => i.status === 'pending');
        if (pendingInspections.length === 0) {
            Alert.alert("Todo al día", "No tienes inspecciones pendientes para sincronizar.");
            return;
        }

        setIsSyncing(true);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        let updatedInspections = inspections.map(insp => insp.status === 'pending' ? { ...insp, status: 'syncing' as const } : insp);
        setInspections(updatedInspections);

        const syncPromises = pendingInspections.map(async (inspection) => {
            try {
                // Esta es una simulación. Aquí iría la lógica para enviar cada inspección a la API.
                console.log(`Sincronizando inspección: ${inspection.id}`);
                await new Promise(resolve => setTimeout(resolve, 1500));
                return { id: inspection.id, success: true };
            } catch (error) {
                return { id: inspection.id, success: false };
            }
        });
        const results = await Promise.all(syncPromises);

        let finalInspections = [...updatedInspections];
        results.forEach(result => {
            const index = finalInspections.findIndex(i => i.id === result.id);
            if (index !== -1) {
                finalInspections[index].status = result.success ? 'synced' : 'pending';
            }
        });

        await AsyncStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(finalInspections));
        setInspections(finalInspections);
        setPendingCount(finalInspections.filter(i => i.status === 'pending').length);
        setIsSyncing(false);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        Alert.alert("Sincronización Completa", "Se han procesado todas las inspecciones pendientes.");
    }, [inspections, netInfo.isConnected]);
    
    useEffect(() => {
        if (netInfo.isConnected && !isSyncing && pendingCount > 0) {
            onSync();
        }
    }, [netInfo.isConnected, pendingCount, isSyncing, onSync]);

    // --- Navegación ---
    const navigateToNewInspection = () => router.push('/(inspector)/nueva-inspeccion' as any);
    const navigateToHistorySearch = () => router.push('/(inspector)/historial' as any);
    const navigateToObleas = () => router.push('/(inspector)/obleas' as any);
    const navigateToReportSending = () => Alert.alert("Próximamente", "Esta función aún no está implementada.");

    return (
        <SafeAreaView style={styles.mainContainer}>
            <AppHeader user={userSession} onLogout={signOut} netInfo={netInfo} themeColors={themeColors} styles={styles} />
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeTitleText}>Panel de Inspector</Text>
                    <Text style={styles.welcomeSubtitle}>Selecciona una opción para comenzar</Text>
                </View>

                {isLoading ? (
                    <ActivityIndicator style={{ marginVertical: 20 }} size="large" color={themeColors.primary} />
                ) : pendingCount > 0 && (
                    <TouchableOpacity style={styles.syncCard} onPress={onSync} disabled={isSyncing || !netInfo.isConnected}>
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
                    <ActionCard icon={<FilePlusIcon color={themeColors.primary} />} title="Nueva Inspección" subtitle="Comenzar un formulario" onPress={navigateToNewInspection} styles={styles} />
                    <ActionCard icon={<ClockIcon color={themeColors.primary} />} title="Consultar Historial" subtitle="Ver inspecciones pasadas" onPress={navigateToHistorySearch} styles={styles} />
                    <ActionCard icon={<TagIcon color={themeColors.primary} />} title="Colocar Obleas" subtitle="Marcar obleas entregadas" onPress={navigateToObleas} styles={styles} />
                </View>
                
                <ActionCard icon={<SendIcon color={themeColors.primary} />} title="Envío de Reportes" subtitle="Enviar copia por email" onPress={navigateToReportSending} styles={styles} fullWidth />

                <View style={styles.separator} />

                <View style={styles.sectionHeader}>
                    <WifiOffIcon color={themeColors.text} />
                    <Text style={styles.sectionTitle}>Modo Offline</Text>
                </View>

                <OfflineDataStatus status={offlineDataStatus} styles={styles} />

                <TouchableOpacity style={styles.offlineButton} onPress={() => cacheOfflineData(false)} disabled={isUpdatingOfflineData}>
                    {isUpdatingOfflineData ? <ActivityIndicator color="#FFFFFF" /> : (
                        <>
                            <DownloadCloudIcon color="#FFFFFF" />
                            <Text style={styles.offlineButtonText}>Actualizar Datos Offline</Text>
                        </>
                    )}
                </TouchableOpacity>
                <Text style={styles.offlineDescription}>
                    {offlineDataStatus ? 'Fuerza la actualización de datos para trabajar sin conexión.' : 'Guarda los datos necesarios para trabajar sin conexión.'}
                </Text>
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
    headerInfoContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.2)' },
    dateText: { fontSize: 16, color: colors.textLight, fontWeight: '600' },
    timeText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' },
    connectionPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 15, gap: 6 },
    onlinePill: { backgroundColor: '#4CAF50' },
    offlinePill: { backgroundColor: '#F44336' },
    connectionPillText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
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
    fullWidthCard: { marginHorizontal: 20, width: '90%' },
    actionIcon: { marginBottom: 12 },
    actionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    actionSubtitle: { fontSize: 13, color: colors.grayMedium, marginTop: 4 },
    actionChevron: { position: 'absolute', top: 15, right: 15, color: colors.grayMedium },
    separator: { height: 1, backgroundColor: colors.border, marginVertical: 25, marginHorizontal: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginLeft: 10 },
    offlineStatusContainerSuccess: { backgroundColor: 'rgba(76, 175, 80, 0.1)', padding: 12, borderRadius: 10, marginHorizontal: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(76, 175, 80, 0.3)' },
    offlineStatusContainerEmpty: { backgroundColor: 'rgba(255, 193, 7, 0.1)', padding: 12, borderRadius: 10, marginHorizontal: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255, 193, 7, 0.3)' },
    offlineStatusText: { textAlign: 'center', fontSize: 13, color: colors.text, fontWeight: '500' },
    offlineButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primaryDark, paddingVertical: 15, borderRadius: 12, gap: 10, marginHorizontal: 20, elevation: 3 },
    offlineButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    offlineDescription: { fontSize: 13, color: colors.grayMedium, textAlign: 'center', marginTop: 12, paddingHorizontal: 30 },
});
