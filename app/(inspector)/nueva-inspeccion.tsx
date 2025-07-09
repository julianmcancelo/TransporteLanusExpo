// =========================================================================
// ARCHIVO: app/(inspector)/nueva-inspeccion.tsx (Corregido)
// =========================================================================

import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { API_TRAMITES_URL } from '@/constants/api';
import { Colors } from '@/constants/Colors';

// --- Tipos ---
interface Habilitacion {
  id: string;
  nro_licencia: string;
  estado: string;
  tipo_transporte: string;
}
interface Titular { nombre: string; }
interface Vehiculo { marca: string; modelo: string; dominio: string; }
interface Turno { fecha: string; hora: string; }
interface Tramite {
  habilitacion: Habilitacion;
  titular: Titular | null;
  vehiculo: Vehiculo | null;
  turno: Turno | null;
}
type IconProps = { color: string };

// --- Iconos ---
const InfoIcon = ({ color }: IconProps) => <Svg width={50} height={50} viewBox="0 0 24 24" fill="none"><Path d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4m0-8h.01" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const CalendarIcon = ({ color }: IconProps) => <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d="M8 2v3M16 2v3M3 8h18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><Path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const UserIcon = ({ color }: IconProps) => <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.5" /><Path d="M12 11a4 4 0 100-8 4 4 0 000 8z" stroke={color} strokeWidth="1.5" /></Svg>;
const TruckIcon = ({ color }: IconProps) => <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d="M14 16.67H9.33a1 1 0 01-1-1V12.33a1 1 0 011-1H14a1 1 0 011 1v3.34a1 1 0 01-1 1z" stroke={color} strokeWidth="1.5" /><Path d="M10.33 11.33V8.83a2 2 0 012-2h0a2 2 0 012 2v2.5M17.5 16.67h1a1 1 0 001-1V10.83a3 3 0 00-3-3H7.5a3 3 0 00-3 3v4.84a1 1 0 001 1h1m9 0v2m-9-2v2" stroke={color} strokeWidth="1.5" /></Svg>;

// --- Componentes de UI ---
const InfoMessage = ({ icon, title, subtitle, onRetry, isRetrying, themeColors }: any) => {
    const styles = getStyles(themeColors);
    return (
        <View style={styles.centeredMessage}>
            <View style={styles.infoIconContainer}>{icon}</View>
            <Text style={styles.infoTitle}>{title}</Text>
            <Text style={styles.infoSubtitle}>{subtitle}</Text>
            {onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry} disabled={isRetrying}>
                    {isRetrying ? <ActivityIndicator color="#fff" /> : <Text style={styles.retryButtonText}>Reintentar</Text>}
                </TouchableOpacity>
            )}
        </View>
    );
};

const InspectionCard = ({ item, onPress, themeColors }: { item: Tramite, onPress: (item: Tramite) => void, themeColors: any }) => {
    const styles = getStyles(themeColors);
    const estado = item.habilitacion?.estado || 'DESCONOCIDO';
    const esEscolar = item.habilitacion?.tipo_transporte === 'Escolar';
    const getStatusColor = () => {
        switch(estado.toUpperCase()) {
            case 'EN TRAMITE': return themeColors.warning;
            case 'HABILITADO': return themeColors.success;
            case 'VENCIDO': return themeColors.error;
            default: return themeColors.grayMedium;
        }
    };

    return (
        <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.7}>
            <View style={[styles.statusStripe, { backgroundColor: getStatusColor() }]} />
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.licenciaText} numberOfLines={1}>Licencia: {item.habilitacion?.nro_licencia || 'N/A'}</Text>
                    <View style={[styles.tipoBadge, { backgroundColor: esEscolar ? `${themeColors.warning}20` : `${themeColors.info}20` }]}>
                        <Text style={[styles.tipoBadgeText, { color: esEscolar ? themeColors.warning : themeColors.info }]}>{item.habilitacion?.tipo_transporte || 'N/A'}</Text>
                    </View>
                </View>
                <View style={styles.cardBody}>
                    <View style={styles.infoSection}><UserIcon color={themeColors.grayMedium} /><Text style={styles.infoText} numberOfLines={1}>{item.titular?.nombre || 'Sin titular'}</Text></View>
                    <View style={styles.infoSection}><TruckIcon color={themeColors.grayMedium} /><Text style={styles.infoText} numberOfLines={1}>{`${item.vehiculo?.marca || ''} ${item.vehiculo?.modelo || ''}`.trim() || 'Sin vehículo'}</Text></View>
                </View>
                <View style={styles.cardFooter}>
                    <View style={styles.dominioBadge}><Text style={styles.dominioText}>{item.vehiculo?.dominio || 'S/D'}</Text></View>
                    <View style={styles.infoSection}><Text style={styles.vencimientoLabel}>Turno:</Text><Text style={styles.vencimientoDate}>{item.turno?.fecha ? new Date(item.turno.fecha + 'T00:00:00').toLocaleDateString('es-AR') : 'N/A'}{item.turno?.hora ? ` a las ${item.turno.hora.substring(0, 5)} hs` : ''}</Text></View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// --- Pantalla Principal ---
export default function SelectInspectionScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = { ...Colors[colorScheme], primary: '#0093D2' };
    const styles = getStyles(themeColors);

    const [tramites, setTramites] = useState<Tramite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTramites = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(API_TRAMITES_URL);
            const result = await response.json();
            if (result.status === 'success') {
                setTramites(result.data || []);
            } else {
                throw new Error(result.message || 'No se pudieron cargar los trámites.');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        fetchTramites();
    }, [fetchTramites]));

    const groupedData = useMemo(() => {
        if (!tramites || tramites.length === 0) return {};
        const sortedData = [...tramites].sort((a, b) => (new Date(a.turno?.fecha as string) as any) - (new Date(b.turno?.fecha as string) as any));
        return sortedData.reduce((acc, item) => {
            const date = item.turno?.fecha ? new Date(item.turno.fecha + 'T00:00:00') : null;
            const groupKey = date ? `Turnos para ${date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}` : "Sin fecha asignada";
            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(item);
            return acc;
        }, {} as Record<string, Tramite[]>);
    }, [tramites]);

    const handleSelectTramite = (item: Tramite) => {
        console.log("Navegando a verificación con:", item.habilitacion.nro_licencia);
        // CORRECCIÓN: Se cambia 'verificacion' por 'verification' para que coincida con el nombre del archivo.
        router.push({
            pathname: '/(inspector)/verification',
            params: { tramite: JSON.stringify(item) }
        });
    };

    const renderContent = () => {
        if (isLoading) return <ActivityIndicator size="large" color={themeColors.primary} style={styles.centeredMessage} />;
        if (error) return <InfoMessage icon={<InfoIcon color={themeColors.grayMedium} />} title="Error al Cargar" subtitle={error} onRetry={fetchTramites} isRetrying={isLoading} themeColors={themeColors} />;
        if (Object.keys(groupedData).length === 0) return <InfoMessage icon={<InfoIcon color={themeColors.grayMedium} />} title="Todo al día" subtitle="No hay trámites pendientes de inspección." onRetry={fetchTramites} isRetrying={isLoading} themeColors={themeColors} />;
        
        return (
            <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchTramites} colors={[themeColors.primary]} tintColor={themeColors.primary} />}>
                {Object.keys(groupedData).map(dateKey => (
                    <View key={dateKey}>
                        <View style={styles.dateHeader}><CalendarIcon color={themeColors.grayMedium} /><Text style={styles.dateHeaderText}>{dateKey}</Text></View>
                        {groupedData[dateKey].map((item) => (
                            <InspectionCard key={item.habilitacion.id} item={item} onPress={handleSelectTramite} themeColors={themeColors} />
                        ))}
                    </View>
                ))}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: "Seleccionar Trámite" }} />
            <View style={styles.header}>
                <Text style={styles.subtitle}>Elige una habilitación para comenzar la inspección.</Text>
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
    centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    infoIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${colors.icon}1A`, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    infoTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
    infoSubtitle: { fontSize: 16, color: colors.grayMedium, textAlign: 'center', marginTop: 8, marginBottom: 25 },
    retryButton: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
    retryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    dateHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, marginBottom: 5 },
    dateHeaderText: { marginLeft: 8, fontSize: 14, fontWeight: 'bold', color: colors.grayMedium, textTransform: 'uppercase' },
    card: { backgroundColor: colors.cardBackground, borderRadius: 12, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, flexDirection: 'row', overflow: 'hidden', marginHorizontal: 20, borderWidth: 1, borderColor: colors.border },
    statusStripe: { width: 6 },
    cardContent: { flex: 1, padding: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    licenciaText: { fontSize: 16, fontWeight: 'bold', color: colors.text, flex: 1 },
    tipoBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 15 },
    tipoBadgeText: { fontSize: 12, fontWeight: 'bold' },
    cardBody: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
    infoSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    infoText: { fontSize: 14, color: colors.grayMedium, marginLeft: 10, flex: 1 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    dominioBadge: { backgroundColor: colors.text, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
    dominioText: { color: colors.background, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    vencimientoLabel: { fontSize: 13, color: colors.grayMedium, marginRight: 5 },
    vencimientoDate: { fontSize: 14, fontWeight: 'bold', color: colors.text },
});
