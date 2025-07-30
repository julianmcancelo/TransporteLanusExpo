// ====================================================================================
// ARCHIVO: app/(inspector)/nueva-inspeccion.tsx (v3.2 - Solución Definitiva de Layout)
// ====================================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    LayoutAnimation,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { API_INSPECCIONES_URL } from '@/constants/api';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Vehiculo } from '../../src/types/habilitacion';

// --- Configuración de Animación para Android ---
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ====================================================================================
// --- Tipos de Datos ---
// ====================================================================================

interface Habilitacion {
    id: string;
    nro_licencia: string;
    estado: 'Vigente' | 'Vencida' | 'En Proceso' | string;
    tipo_transporte: string;
    expte: string;
}
interface Titular { nombre: string; dni: string; }
interface Turno { fecha: string; hora: string; estado: string; }
interface Tramite {
    habilitacion: Habilitacion;
    titular: Titular | null;
    vehiculo: Vehiculo | null;
    turno: Turno | null;
}
type IconProps = { color: string, size?: number };

// ====================================================================================
// --- Componentes de Iconos (SVG) ---
// ====================================================================================

const InfoIcon = ({ color, size = 24 }: IconProps) => <Svg width={size*1.5} height={size*1.5} viewBox="0 0 24 24" fill="none"><Path d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4m0-8h.01" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const CalendarIcon = ({ color, size = 24 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M8 2v4M16 2v4M3 10h18M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const UserIcon = ({ color, size = 24 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const CarIcon = ({ color, size = 24 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M14 16.67H9.33a1 1 0 01-1-1V12.33a1 1 0 011-1H14a1 1 0 011 1v3.34a1 1 0 01-1 1z" stroke={color} strokeWidth="2" /><Path d="M10.33 11.33V8.83a2 2 0 012-2h0a2 2 0 012 2v2.5M17.5 16.67h1a1 1 0 001-1V10.83a3 3 0 00-3-3H7.5a3 3 0 00-3 3v4.84a1 1 0 001 1h1m9 0v2m-9-2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const ArrowLeftIcon = ({ color, size = 24 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const CloudIcon = ({ color, size = 16 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M18 10h-1.26A8 8 0 104 16.29" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const DatabaseIcon = ({ color, size = 16 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3c0-1.66 4-3 9-3s9 1.34 9 3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;

// ====================================================================================
// --- Componentes de UI Reutilizables ---
// ====================================================================================

const AnimatedView = ({ children, index = 0 }: { children: React.ReactNode, index?: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    React.useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: true }).start();
        Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: index * 100, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    }, [fadeAnim, slideAnim, index]);

    return <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>{children}</Animated.View>;
};

const InfoMessage = ({ title, subtitle, onRetry, isRetrying, themeColors, styles }: any) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    return (
        <View style={styles.centeredMessage}>
            <AnimatedView>
                <View style={{alignItems: 'center'}}>
                    <InfoIcon color={themeColors.primary} size={40}/>
                    <Text style={styles.infoTitle}>{title}</Text>
                    <Text style={styles.infoSubtitle}>{subtitle}</Text>
                    {onRetry && (
                        <TouchableOpacity
                            onPress={onRetry}
                            disabled={isRetrying}
                            activeOpacity={0.8}
                            onPressIn={handlePressIn}
                            onPressOut={handlePressOut}
                        >
                            <Animated.View style={[styles.retryButton, { transform: [{ scale: scaleAnim }] }]}>
                                {isRetrying ? <ActivityIndicator color="#fff" /> : <Text style={styles.retryButtonText}>Reintentar</Text>}
                            </Animated.View>
                        </TouchableOpacity>
                    )}
                </View>
            </AnimatedView>
        </View>
    );
};


const InfoRow = ({ label, value, icon, styles }: { label: string, value: string | undefined | null, icon: React.ReactNode, styles: any }) => {
    if (!value || value.trim() === '') return null;
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>{icon}</View>
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
        ? `${new Date((item.turno.fecha ?? "") + 'T00:00:00').toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: 'numeric'})} a las ${item.turno.hora.substring(0, 5)} hs`
        : 'Sin turno asignado';

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();

    return (
        <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={() => onPress(item)} activeOpacity={0.9}>
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

// ====================================================================================
// --- Pantalla Principal: SelectInspectionScreen ---
// ====================================================================================

export default function SelectInspectionScreen() {
    const router = useRouter();
    const themeColors = useThemeColors();
    const styles = getStyles(themeColors);

    const [tramites, setTramites] = useState<Tramite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<'cloud' | 'cache' | null>(null);

    const fetchTramites = useCallback(async (isRefresh = false) => {
        if (!isRefresh && tramites.length === 0) setIsLoading(true);
        setError(null);
        setDataSource(null);
        try {
            const response = await fetch(API_INSPECCIONES_URL, {
                cache: 'no-cache',
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
            });
            if (!response.ok) throw new Error('No se pudo conectar al servidor.');

            const result = await response.json();
            if (result.status === 'success') {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                const data = result.data || [];
                setTramites(data);
                setDataSource('cloud');
                await AsyncStorage.setItem('@tramites_cache', JSON.stringify(data));
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
                    setError('Error de red y no hay datos locales disponibles.');
                }
            } catch (cacheError: any) {
                console.error("Error al leer el caché:", cacheError);
                setError("Error de red y no se pudo leer el caché local.");
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [tramites.length]);

    useFocusEffect(useCallback(() => { fetchTramites(); }, [fetchTramites]));

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchTramites(true);
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
            pathname: '/(inspector)/inspeccion-detalle',
            params: { tramite: JSON.stringify(item) }
        });
    };

    const renderContent = () => {
        if (isLoading) return <View style={styles.centeredMessage}><ActivityIndicator size="large" color={themeColors.primary} /></View>;
        if (error) return <InfoMessage title="Error al Cargar" subtitle={error} onRetry={() => fetchTramites()} isRetrying={isLoading} themeColors={themeColors} styles={styles} />;
        if (Object.keys(groupedData).length === 0) return <InfoMessage title="Todo al día" subtitle="No hay trámites pendientes de inspección." onRetry={() => fetchTramites(true)} isRetrying={isRefreshing} themeColors={themeColors} styles={styles} />;

        let cardIndex = 0;
        return (
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[themeColors.primary]} tintColor={themeColors.primary} />}
            >
                {Object.keys(groupedData).map((dateKey, groupIndex) => (
                    <AnimatedView key={dateKey} index={groupIndex}>
                        <View style={styles.dateGroup}>
                            <Text style={styles.dateHeaderText}>{dateKey}</Text>
                            {groupedData[dateKey].map((item) => {
                                cardIndex++;
                                return (
                                    <AnimatedView key={item.habilitacion.id} index={cardIndex * 0.5}>
                                        <InspectionCard item={item} onPress={handleSelectTramite} themeColors={themeColors} styles={styles} />
                                    </AnimatedView>
                                );
                            })}
                        </View>
                    </AnimatedView>
                ))}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style={themeColors.colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={themeColors.background} translucent={false} />
            <Stack.Screen
                options={{
                    title: "Seleccionar Trámite",
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
}

// ====================================================================================
// --- Estilos (StyleSheet) ---
// ====================================================================================

const getStyles = (colors: any) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    subtitle: { fontSize: 16, color: colors.grayMedium, },
    listContainer: { flex: 1 },
    scrollContent: { paddingVertical: 20, },
    centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: colors.background },
    infoTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginTop: 16 },
    infoSubtitle: { fontSize: 16, color: colors.grayMedium, textAlign: 'center', marginTop: 8, marginBottom: 25, lineHeight: 22 },
    retryButton: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 35, borderRadius: 30, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    dateGroup: { marginBottom: 16 },
    dateHeaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.grayMedium,
        textTransform: 'uppercase',
        marginBottom: 15,
        paddingHorizontal: 20,
        opacity: 0.8
    },
    card: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    cardTitle: { fontSize: 16, fontWeight: '600', color: colors.primaryDark, flexShrink: 1, marginRight: 8 },
    cardContent: { paddingHorizontal: 20, paddingVertical: 15, gap: 18 },
    statusBadge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20 },
    statusBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    infoIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    infoTextContainer: { flex: 1 },
    label: { fontSize: 13, color: colors.grayMedium, marginBottom: 2 },
    value: { fontSize: 16, fontWeight: '500', color: colors.text },
    headerBackButton: { padding: 10, marginLeft: 10 },
    dataSourceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: colors.border,
        borderRadius: 20,
        alignSelf: 'flex-start'
    },
    dataSourceText: { marginLeft: 8, fontSize: 12, color: colors.grayMedium, fontWeight: '500' },
});