import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, LayoutAnimation, Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, UIManager, View } from 'react-native';

import QRScannerModal from '@/components/QRScannerModal';
import ActionCard from '../../components/ui/ActionCard';
import AppHeader from '../../components/ui/AppHeader';
import { Clock, ConnectionStatus, OfflineDataStatus } from '../../components/ui/DashboardComponents';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/hooks/useTheme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Inspection {
  id: string;
  location: string;
  date: string;
  status: 'pending' | 'syncing' | 'synced';
}
const INSPECTIONS_STORAGE_KEY = '@inspections_data';
const OFFLINE_DATA_KEY = '@offline_prepared_data';

export default function InspectorScreen() {
    const { session: user, signOut } = useAuth();
    const router = useRouter();
    const { colors, styles, colorScheme } = useTheme();
    const netInfo = useNetInfo();
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isUpdatingOfflineData, setIsUpdatingOfflineData] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPerformedInitialCache, setHasPerformedInitialCache] = useState(false);
    const [offlineDataStatus, setOfflineDataStatus] = useState<string | null>(null);
    const [isQRScannerVisible, setIsQRScannerVisible] = useState(false);

    const cacheOfflineData = useCallback(async (isAutomatic: boolean = false) => {
        if (!isAutomatic) setIsUpdatingOfflineData(true);
        try {
            const preparedAt = new Date().toISOString();
            await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify({ preparedAt, user }));
            setOfflineDataStatus(preparedAt);
            if (!isAutomatic) Alert.alert("Datos Actualizados", "Los datos para trabajar sin conexión han sido actualizados.");
        } catch (error) {
            if (!isAutomatic) Alert.alert("Error", "No se pudieron guardar los datos para el modo offline.");
            console.error("Error en cacheOfflineData:", error);
        } finally {
            if (!isAutomatic) setIsUpdatingOfflineData(false);
        }
    }, [user]);

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
                console.log(`Sincronizando inspección: ${inspection.id}`);
                await new Promise(resolve => setTimeout(resolve, 1500));
                return { id: inspection.id, success: true };
            } catch {
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

    
    const navigateToHistorySearch = () => router.push('/(inspector)/historial' as any);
    const navigateToObleas = () => router.push('/(inspector)/obleas' as any);
    const navigateToReportSending = () => Alert.alert("Próximamente", "Esta función aún no está implementada.");
    const navigateToUpdateData = () => router.push('/(inspector)/gestion-legajo' as any);
    const openQRScanner = () => setIsQRScannerVisible(true);

    // Android-specific container style to ensure content is below status bar
    const androidContainerStyle = {
        flex: 1,
        backgroundColor: colors.background,
        ...(Platform.OS === 'android' && {
            paddingTop: StatusBar.currentHeight || 0,
        })
    };

    return (
        <View style={androidContainerStyle}>
            <StatusBar 
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
                backgroundColor={colors.background} 
                translucent={false}
            />
            <SafeAreaView style={styles.mainContainer}>
            <AppHeader user={user} onLogout={signOut} />
            <ScrollView contentContainerStyle={styles.container}>

                {isLoading ? (
                    <ActivityIndicator style={{ marginVertical: 20 }} size="large" color={colors.primary} />
                ) : pendingCount > 0 && (
                    <TouchableOpacity style={styles.syncCard} onPress={onSync} disabled={isSyncing || !netInfo.isConnected}>
                        <View style={styles.syncIcon}>
                            {isSyncing ? <ActivityIndicator color={colors.white} /> : <IconSymbol name='arrow.triangle.2.circlepath' size={24} color={colors.white} />}
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.syncCardTitle}>{isSyncing ? "Sincronizando..." : "Sincronización Pendiente"}</Text>
                            <Text style={styles.syncCardSubtitle}>Tienes {pendingCount} inspeccion(es) para enviar.</Text>
                        </View>
                        
                    </TouchableOpacity>
                )}

                <View style={styles.grid}>
                    <ActionCard
                        icon={<IconSymbol name='doc.text.fill' size={24} color={colors.primary} />}
                        title="Nueva Inspección"
                        subtitle="Iniciar un nuevo registro de inspección"
                        onPress={() => router.push('/(inspector)/nueva-inspeccion')}
                    />
                    <ActionCard
                        icon={<IconSymbol name='clock.arrow.circlepath' size={24} color={colors.primary} />}
                        title="Consultar Historial"
                        subtitle="Ver inspecciones pasadas"
                        onPress={navigateToHistorySearch}
                    />
                    <ActionCard
                        icon={<IconSymbol name='checkmark.circle.fill' size={24} color={colors.success} />}
                        title="Colocar Obleas"
                        subtitle="Marcar obleas entregadas"
                        onPress={navigateToObleas}
                    />
                    <ActionCard
                        icon={<IconSymbol name='doc.text.fill' size={24} color={colors.primary} />}
                        title="Actualizar Datos"
                        subtitle="Editar un legajo existente"
                        onPress={navigateToUpdateData}
                    />
                    <ActionCard
                        icon={<IconSymbol name='doc.text.fill' size={24} color={colors.primary} />}
                        title="Envío de Reportes"
                        subtitle="Enviar copia por email"
                        onPress={navigateToReportSending}
                    />
                </View>

                <View style={styles.separator} />

                <View style={styles.sectionHeader}>
                    <IconSymbol name='wifi.slash' size={16} color={colors.text} />
                    <Text style={styles.sectionTitle}>Modo Offline</Text>
                </View>

                <View style={styles.offlineContainer}>
                    <OfflineDataStatus status={offlineDataStatus} />
                    <TouchableOpacity style={styles.offlineButton} onPress={() => cacheOfflineData(false)} disabled={isUpdatingOfflineData}>
                        {isUpdatingOfflineData ? <ActivityIndicator color={colors.white} /> : (
                            <>
                                <IconSymbol name='arrow.triangle.2.circlepath' size={24} color={colors.white} />
                                <Text style={styles.offlineButtonText}>Actualizar Datos</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.offlineDescription}>
                        {offlineDataStatus ? 'Fuerza la actualización para trabajar sin conexión.' : 'Guarda los datos para trabajar sin conexión.'}
                    </Text>
                </View>
            </ScrollView>
            <View style={styles.footerInfo}>
                <Clock />
                <ConnectionStatus isConnected={netInfo.isConnected} />
            </View>
            
            {/* Floating QR Scanner Button */}
            <TouchableOpacity style={styles.floatingButton} onPress={openQRScanner}>
                <IconSymbol name='qrcode.viewfinder' size={24} color='#ffffff' />
            </TouchableOpacity>
            
            {/* QR Scanner Modal */}
            <QRScannerModal
                isVisible={isQRScannerVisible}
                onClose={() => setIsQRScannerVisible(false)}
            />
            </SafeAreaView>
        </View>
    );
}
