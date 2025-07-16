// =========================================================================
// ARCHIVO: app/(inspector)/nueva-inspeccion.tsx (v2.0 - con Actualización Forzada)
// Muestra la lista de trámites con "deslizar para refrescar" y previene el caché.
// =========================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, LayoutAnimation, Platform, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { API_TRAMITES_URL } from '@/constants/api';
import { Colors } from '@/constants/Colors';

// --- Configuración de Animación para Android ---
if (Platform.OS === 'android' && require('react-native').UIManager.setLayoutAnimationEnabledExperimental) {
    require('react-native').UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Tipos ---
interface Habilitacion {
    id: string;
    nro_licencia: string;
    estado: 'Vigente' | 'Vencida' | 'En Proceso' | string;
    tipo_transporte: string;
    expte: string;
}
interface Titular { nombre: string; dni: string; }
interface Vehiculo { marca: string; modelo: string; dominio: string; }
interface Turno { fecha: string; hora: string; estado: string; }
interface Tramite {
    habilitacion: Habilitacion;
    titular: Titular | null;
    vehiculo: Vehiculo | null;
    turno: Turno | null;
}
type IconProps = { color: string };

// --- Iconos ---
const InfoIcon = ({ color }: IconProps) => <Svg width={50} height={50} viewBox="0 0 24 24" fill="none"><Path d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4m0-8h.01" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const CalendarIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M8 2v4M16 2v4M3 10h18M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const UserIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const CarIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M14 16.67H9.33a1 1 0 01-1-1V12.33a1 1 0 011-1H14a1 1 0 011 1v3.34a1 1 0 01-1 1z" stroke={color} strokeWidth="2" /><Path d="M10.33 11.33V8.83a2 2 0 012-2h0a2 2 0 012 2v2.5M17.5 16.67h1a1 1 0 001-1V10.83a3 3 0 00-3-3H7.5a3 3 0 00-3 3v4.84a1 1 0 001 1h1m9 0v2m-9-2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const ArrowLeftIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const CloudIcon = ({ color }: IconProps) => <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d="M18 10h-1.26A8 8 0 104 16.29" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const DatabaseIcon = ({ color }: IconProps) => <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3c0-1.66 4-3 9-3s9 1.34 9 3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;

// --- Componentes de UI Animados ---
const AnimatedView = ({ children, index = 0 }: { children: React.ReactNode, index?: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            delay: index * 100,
            useNativeDriver: true,
        }).start();
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            delay: index * 100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, [fadeAnim, slideAnim, index]);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {children}
        </Animated.View>
    );
};

const InfoMessage = ({ title, subtitle, onRetry, isRetrying, themeColors, styles }: any) => (
    <AnimatedView>
        <View style={styles.centeredMessage}>
            <View style={styles.infoIconContainer}><InfoIcon color={themeColors.primary} /></View>
            <Text style={styles.infoTitle}>{title}</Text>
            <Text style={styles.infoSubtitle}>{subtitle}</Text>
            {onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry} disabled={isRetrying}>
                    {isRetrying ? <ActivityIndicator color="#fff" /> : <Text style={styles.retryButtonText}>Reintentar</Text>}
                </TouchableOpacity>
            )}
        </View>
    </AnimatedView>
);

const InfoRow = ({ label, value, icon, styles }: { label: string, value: string | undefined | null, icon: React.ReactNode, styles: any }) => {
    if (!value || value.trim() === '') return null;
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

const InspectionCard = ({ item, onPress, themeColors, styles }: { item: Tramite, onPress: (item: Tramite) => void, themeColors: any, styles: any }) => {
    const turnoInfo = item.turno 
        ? `${new Date(item.turno.fecha + 'T00:00:00').toLocaleDateString('es-AR')} a las ${item.turno.hora.substring(0, 5)} hs`
        : 'Sin turno asignado';

    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
    };
    const handlePressOut = () => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
    };

    return (
        <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => onPress(item)}
            activeOpacity={0.9}
        >
            <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Licencia {item.habilitacion.nro_licencia}</Text>
                    <StatusBadge estado={item.habilitacion.estado} themeColors={themeColors} styles={styles} />
                </View>
                <View style={styles.cardContent}>
                    <InfoRow label="Titular" value={item.titular?.nombre} icon={<UserIcon color={themeColors.primary} />} styles={styles} />
                    <InfoRow label="Vehículo" value={`${item.vehiculo?.marca || ''} ${item.vehiculo?.modelo || ''} (${item.vehiculo?.dominio || 'S/D'})`.trim()} icon={<CarIcon color={themeColors.primary} />} styles={styles} />
                    <InfoRow label="Turno" value={turnoInfo} icon={<CalendarIcon color={themeColors.primary} />} styles={styles} />
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

// --- Pantalla Principal ---
export default function SelectInspectionScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = {
        ...Colors[colorScheme],
        primary: '#00AEEF',
        primaryDark: '#008ACD',
    };
    const styles = getStyles(themeColors);

    const [tramites, setTramites] = useState<Tramite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false); // Estado para el pull-to-refresh
    const [error, setError] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<'cloud' | 'cache' | null>(null);

    const fetchTramites = useCallback(async (isRefresh = false) => {
        if (!isRefresh) {
            setIsLoading(true);
        }
        setError(null);
        setDataSource(null);
        try {
            // ✅ MODIFICACIÓN: Se añaden cabeceras para evitar el caché
            const response = await fetch(API_TRAMITES_URL, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                },
            });
            if (!response.ok) throw new Error('No se pudo conectar al servidor.');
            
            const result = await response.json();
            if (result.status === 'success') {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setTramites(result.data || []);
                setDataSource('cloud');
                await AsyncStorage.setItem('@tramites_cache', JSON.stringify(result.data || []));
            } else {
                throw new Error(result.message || 'No se pudieron cargar los trámites.');
            }
        } catch (e: any) {
            console.log("Error de red, intentando cargar desde caché:", e.message);
            try {
                const cachedData = await AsyncStorage.getItem('@tramites_cache');
                if (cachedData) {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setTramites(JSON.parse(cachedData));
                    setDataSource('cache');
                } else {
                    setError(e.message);
                }
            } catch (cacheError: any) {
                setError("Error de red y no se pudo leer el caché local.");
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false); // Siempre detener el indicador de refresco
        }
    }, []);

    // Carga inicial al enfocar la pantalla
    useFocusEffect(useCallback(() => {
        fetchTramites();
    }, [fetchTramites]));

    // Función para manejar el gesto de "deslizar para refrescar"
    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchTramites(true); // Llama a fetchTramites indicando que es un refresco
    }, [fetchTramites]);

    const groupedData = useMemo(() => {
        if (!tramites || tramites.length === 0) return {};
        const sortedData = [...tramites].sort((a, b) => new Date(a.turno?.fecha as string).getTime() - new Date(b.turno?.fecha as string).getTime());
        return sortedData.reduce((acc, item) => {
            const date = item.turno?.fecha ? new Date(item.turno.fecha + 'T00:00:00') : null;
            const groupKey = date ? `Turnos para ${date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}` : "Sin Fecha Asignada";
            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(item);
            return acc;
        }, {} as Record<string, Tramite[]>);
    }, [tramites]);

    const handleSelectTramite = (item: Tramite) => {
        router.push({
            pathname: '/(inspector)/inspecciones',
            params: { tramite: JSON.stringify(item) }
        });
    };

    const renderContent = () => {
        if (isLoading) return <ActivityIndicator size="large" color={themeColors.primary} style={{ flex: 1 }} />;
        if (error) return <InfoMessage title="Error al Cargar" subtitle={error} onRetry={() => fetchTramites()} isRetrying={isLoading} themeColors={themeColors} styles={styles} />;
        if (Object.keys(groupedData).length === 0) return <InfoMessage title="Todo al día" subtitle="No hay trámites pendientes de inspección." onRetry={() => fetchTramites()} isRetrying={isLoading} themeColors={themeColors} styles={styles} />;
        
        let cardIndex = 0;
        return (
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                // ✅ MODIFICACIÓN: Se usa isRefreshing para el control
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[themeColors.primary]} tintColor={themeColors.primary} />}
            >
                {Object.keys(groupedData).map(dateKey => (
                    <AnimatedView key={dateKey} index={cardIndex++}>
                        <View style={styles.dateGroup}>
                            <Text style={styles.dateHeaderText}>{dateKey}</Text>
                            {groupedData[dateKey].map((item) => (
                                <AnimatedView key={item.habilitacion.id} index={cardIndex++}>
                                    <InspectionCard item={item} onPress={handleSelectTramite} themeColors={themeColors} styles={styles} />
                                </AnimatedView>
                            ))}
                        </View>
                    </AnimatedView>
                ))}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ 
                title: "Seleccionar Trámite",
                headerStyle: { backgroundColor: themeColors.background },
                headerTitleStyle: { color: themeColors.text },
                headerShadowVisible: false,
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                        <ArrowLeftIcon color={themeColors.primary} />
                    </TouchableOpacity>
                ),
            }} />
            <View style={styles.header}>
                <Text style={styles.subtitle}>Elige una habilitación para comenzar la inspección.</Text>
                {dataSource && (
                    <AnimatedView>
                        <View style={styles.dataSourceContainer}>
                            {dataSource === 'cloud' ? <CloudIcon color={themeColors.success} /> : <DatabaseIcon color={themeColors.warning} />}
                            <Text style={styles.dataSourceText}>
                                {dataSource === 'cloud' ? 'Datos desde la nube' : 'Mostrando datos locales'}
                            </Text>
                        </View>
                    </AnimatedView>
                )}
            </View>
            <View style={styles.listContainer}>
                {renderContent()}
            </View>
        </SafeAreaView>
    );
};

// --- Estilos ---
const getStyles = (colors: any) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: 5, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
    subtitle: { fontSize: 16, color: colors.grayMedium },
    listContainer: { flex: 1 },
    scrollContent: { paddingVertical: 20 },
    centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    infoIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 174, 239, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    infoTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
    infoSubtitle: { fontSize: 16, color: colors.grayMedium, textAlign: 'center', marginTop: 8, marginBottom: 25 },
    retryButton: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
    retryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    dateGroup: { marginBottom: 10 },
    dateHeaderText: { fontSize: 14, fontWeight: 'bold', color: colors.grayMedium, textTransform: 'uppercase', marginBottom: 15, paddingHorizontal: 20 },
    card: { backgroundColor: colors.cardBackground, borderRadius: 16, marginHorizontal: 20, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 5 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(0, 174, 239, 0.05)' },
    cardTitle: { fontSize: 16, fontWeight: '600', color: colors.primaryDark, flex: 1 },
    cardContent: { paddingHorizontal: 20, paddingVertical: 15, gap: 16 },
    statusBadge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20 },
    statusBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    infoTextContainer: { flex: 1 },
    label: { fontSize: 14, color: colors.grayMedium },
    value: { fontSize: 16, fontWeight: '500', color: colors.text },
    headerBackButton: { padding: 10, marginLeft: 10 },
    dataSourceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: colors.border,
        borderRadius: 15,
        alignSelf: 'flex-start',
    },
    dataSourceText: {
        marginLeft: 8,
        fontSize: 12,
        color: colors.grayMedium,
        fontWeight: '500',
    },
});
