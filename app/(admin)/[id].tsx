import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { getHabilitacionDetalle } from '../../src/services/api';
import { Persona } from '../../src/types/habilitacion';

// --- Componentes de UI Mejorados ---
const ActionButton = ({ icon, label, onPress }: { icon: React.ComponentProps<typeof Feather>['name'], label: string, onPress: () => void }) => {
    const styles = getStyles();
    return (
        <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            <Feather name={icon} size={24} color={styles.actionButtonText.color} />
            <Text style={styles.actionButtonText}>{label}</Text>
        </TouchableOpacity>
    );
};

const TabButton = ({ label, isActive, onPress }: { label: string, isActive: boolean, onPress: () => void }) => {
    const styles = getStyles();
    return (
        <TouchableOpacity style={styles.tabButton} onPress={onPress}>
            <Text style={[styles.tabButtonText, isActive && styles.tabButtonActive]}>{label}</Text>
            {isActive && <View style={styles.tabActiveIndicator} />}
        </TouchableOpacity>
    );
};

const DetailRow = ({ label, value }: { label: string, value?: string | number | null }) => {
    const styles = getStyles();
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value || 'N/A'}</Text>
        </View>
    );
};

const getStatusStyle = (estado: string) => {
    switch (estado) {
        case 'HABILITADO': return { color: '#2E7D32', backgroundColor: '#E8F5E9', label: 'Habilitado' };
        case 'EN TRAMITE': return { color: '#F57F17', backgroundColor: '#FFFDE7', label: 'En Trámite' };
        default: return { color: '#C62828', backgroundColor: '#FFEBEE', label: estado || 'Desconocido' };
    }
};

export default function HabilitacionDetalleScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const styles = getStyles();
    const habilitacionId = Number(id);
    const [activeTab, setActiveTab] = useState<'resumen' | 'personas' | 'historial'>('resumen');

    const { data: habilitacion, isLoading, error } = useQuery({
        queryKey: ['habilitacionDetalle', habilitacionId],
        queryFn: () => getHabilitacionDetalle(habilitacionId),
        enabled: !isNaN(habilitacionId),
    });

    const historialUnificado = useMemo(() => {
        if (!habilitacion) return [];
        const inspecciones = (habilitacion.historial_inspecciones || []).map(item => ({ ...item, tipo: 'Inspección', fecha: item.fecha_inspeccion }));
        return [...inspecciones].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [habilitacion]);

    if (isLoading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#03A9F4" /></View>;
    }
    if (error || !habilitacion) {
        return <View style={styles.centered}><Text style={styles.errorText}>Error al cargar el detalle.</Text></View>;
    }

    const status = getStatusStyle(habilitacion.estado);

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color="#03A9F4" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.title}>{habilitacion.nro_licencia}</Text>
                    <Text style={styles.subtitle}>{habilitacion.titular_principal}</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: status.backgroundColor }]}>
                    <Text style={[styles.statusChipText, { color: status.color }]}>{status.label}</Text>
                </View>
            </View>

            <View style={styles.actionsContainer}>
                <ActionButton icon="truck" label="Vehículo" onPress={() => router.push(`/asignar-vehiculo?id=${habilitacionId}` as any)} />
                <ActionButton icon="user-plus" label="Persona" onPress={() => router.push(`/asignar-persona?id=${habilitacionId}` as any)} />
                <ActionButton icon="calendar" label="Turno" onPress={() => {/* Navegar a nuevo turno */}} />
                <ActionButton icon="file-text" label="Inspección" onPress={() => {/* Navegar a nueva inspección */}} />
            </View>

            <View style={styles.tabContainer}>
                <TabButton label="Resumen" isActive={activeTab === 'resumen'} onPress={() => setActiveTab('resumen')} />
                <TabButton label="Personas" isActive={activeTab === 'personas'} onPress={() => setActiveTab('personas')} />
                <TabButton label="Historial" isActive={activeTab === 'historial'} onPress={() => setActiveTab('historial')} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {activeTab === 'resumen' && (
                    <>
                        {habilitacion.vehiculo && (
                            <View style={styles.card}>
                                <View style={styles.cardTitleContainer}>
                                    <Feather name="truck" size={22} color="#03A9F4" />
                                    <Text style={styles.cardTitle}>Vehículo Asociado</Text>
                                </View>
                                <View style={styles.cardContent}>
                                    <DetailRow label="Dominio" value={habilitacion.vehiculo.dominio} />
                                    <DetailRow label="Marca / Modelo" value={`${habilitacion.vehiculo.marca} ${habilitacion.vehiculo.modelo}`} />
                                    <DetailRow label="Año" value={habilitacion.vehiculo.ano} />
                                    <DetailRow label="Chasis" value={habilitacion.vehiculo.chasis} />
                                    <DetailRow label="VTV Vence" value={habilitacion.vehiculo.Vencimiento_VTV ? new Date(habilitacion.vehiculo.Vencimiento_VTV).toLocaleDateString() : "-"} />
                                    <DetailRow label="Seguro Vence" value={habilitacion.vehiculo.Vencimiento_Poliza ? new Date(habilitacion.vehiculo.Vencimiento_Poliza).toLocaleDateString() : "-"} />
                                </View>
                            </View>
                        )}
                        <View style={styles.card}>
                             <View style={styles.cardTitleContainer}>
                                <Feather name="file-text" size={22} color="#03A9F4" />
                                <Text style={styles.cardTitle}>Datos de Habilitación</Text>
                            </View>
                            <View style={styles.cardContent}>
                                <DetailRow label="Expediente" value={habilitacion.expte} />
                                <DetailRow
                                    label="Vigencia"
                                    value={`${
                                        habilitacion.vigencia_inicio ? new Date(habilitacion.vigencia_inicio).toLocaleDateString() : "N/A"
                                    } - ${
                                        habilitacion.vigencia_fin ? new Date(habilitacion.vigencia_fin).toLocaleDateString() : "N/A"
                                    }`}
                                />
                            </View>
                        </View>
                    </>
                )}
                {activeTab === 'personas' && (
                    (habilitacion.personas || []).map((p: Persona) => (
                        <View key={p.id} style={styles.card}>
                            <View style={styles.cardTitleContainer}>
                                <Feather name="user" size={22} color="#03A9F4" />
                                <Text style={styles.cardTitle}>{p.rol}</Text>
                            </View>
                            <View style={styles.cardContent}>
                                <DetailRow label="Nombre" value={p.nombre} />
                                <DetailRow label="DNI" value={p.dni} />
                            </View>
                        </View>
                    ))
                )}
                {activeTab === 'historial' && (
                    <View style={styles.card}>
                        <View style={styles.cardTitleContainer}>
                            <Feather name="activity" size={22} color="#03A9F4" />
                            <Text style={styles.cardTitle}>Línea de Tiempo</Text>
                        </View>
                        <View style={styles.cardContent}>
                           {historialUnificado.map((item: any, index: number) => (
                               <View key={index} style={styles.timelineItem}>
                                   <View style={styles.timelineIcon}><Feather name="check-circle" size={16} color="white" /></View>
                                   <View style={styles.timelineContent}>
                                       <Text style={styles.timelineTitle}>{item.tipo} - {new Date(item.fecha).toLocaleDateString()}</Text>
                                       <Text style={styles.timelineSubtitle}>Inspector: {item.nombre_inspector}</Text>
                                   </View>
                               </View>
                           ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = () => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
    errorText: { color: '#D32F2F', fontSize: 16 },
    header: {
        paddingTop: Platform.OS === 'android' ? 40 : 50, paddingBottom: 20, paddingHorizontal: 20,
        backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
        alignItems: 'center',
    },
    backButton: { position: 'absolute', left: 20, top: Platform.OS === 'android' ? 45 : 55, zIndex: 10 },
    headerTitleContainer: { alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#03A9F4' },
    subtitle: { fontSize: 16, color: '#212121', marginTop: 4 },
    statusChip: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 99 },
    statusChipText: { fontSize: 14, fontWeight: 'bold' },
    actionsContainer: {
        flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16,
        backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
    },
    actionButton: { alignItems: 'center', gap: 6 },
    actionButtonText: { fontSize: 12, color: '#0284C7', fontWeight: '600' },
    tabContainer: {
        flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
    },
    tabButton: { alignItems: 'center' },
    tabButtonText: { fontSize: 16, fontWeight: 'bold', color: '#757575', paddingVertical: 14 },
    tabButtonActive: { color: '#03A9F4' },
    tabActiveIndicator: { height: 3, backgroundColor: '#03A9F4', width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    scrollContent: { padding: 20 },
    card: {
        backgroundColor: 'white', borderRadius: 16, marginBottom: 20,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    },
    cardTitleContainer: {
        flexDirection: 'row', alignItems: 'center', padding: 16,
        borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    },
    cardTitle: { fontWeight: 'bold', fontSize: 18, color: '#212121', marginLeft: 12 },
    cardContent: { paddingHorizontal: 16, paddingBottom: 8 },
    detailRow: {
        flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#F5F5F5'
    },
    detailLabel: { color: '#757575', fontSize: 15 },
    detailValue: { fontWeight: '600', color: '#212121', textAlign: 'right', flexShrink: 1, fontSize: 15 },
    timelineItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, gap: 12 },
    timelineIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#03A9F4', justifyContent: 'center', alignItems: 'center' },
    timelineContent: { flex: 1, paddingTop: 4 },
    timelineTitle: { fontWeight: 'bold', color: '#424242' },
    timelineSubtitle: { fontSize: 13, color: '#757575', marginTop: 2 },
});