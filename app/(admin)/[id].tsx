// app/(admin)/habilitacion/[id].tsx

import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
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
import Svg, { Path } from 'react-native-svg';

import { getHabilitacionDetalle } from '../../src/services/api';
import { Persona } from '../../src/types/habilitacion';

// --- Íconos ---
const BackIcon = ({ color }: { color: string }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>;

// --- Componentes de UI ---

const InfoSection = ({ title, icon, children }: { 
  title: string; 
  icon: React.ComponentProps<typeof Feather>['name']; 
  children: React.ReactNode 
}) => {
    const styles = getStyles();
    return (
        <View style={styles.card}>
            <View style={styles.cardTitleContainer}>
                <Feather name={icon} size={20} color="#0288D1" />
                <Text style={styles.cardTitle}>{title}</Text>
            </View>
            <View style={styles.cardContent}>
                {children}
            </View>
        </View>
    );
};

const DetailRow = ({ label, value }: { 
  label: string; 
  value: string | number | null | undefined 
}) => {
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
        case 'HABILITADO':
            return { color: '#16a34a', backgroundColor: '#f0fdf4', label: 'Habilitado' };
        case 'EN TRAMITE':
            return { color: '#f59e0b', backgroundColor: '#fefce8', label: 'En Trámite' };
        default:
            return { color: '#dc2626', backgroundColor: '#fef2f2', label: estado || 'Desconocido' };
    }
};

export default function HabilitacionDetalleScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const styles = getStyles();
    const habilitacionId = Number(id);

    const { data: habilitacion, isLoading, error } = useQuery({
        queryKey: ['habilitacionDetalle', habilitacionId],
        queryFn: () => getHabilitacionDetalle(habilitacionId),
        enabled: !isNaN(habilitacionId),
    });

    if (isLoading) {
        return <View style={styles.centered}><ActivityIndicator animating={true} size="large" color="#0288D1" /></View>;
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
                    <BackIcon color="#01579B" />
                </TouchableOpacity>
                <Text style={styles.title} numberOfLines={1}>Lic. {habilitacion.nro_licencia}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.mainInfoContainer}>
                    <Text style={styles.mainTitle}>{habilitacion.titular_principal}</Text>
                    <View style={[styles.statusChip, { backgroundColor: status.backgroundColor }]}>
                        <Text style={[styles.statusChipText, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>

                <InfoSection title="Datos Generales" icon="file-text">
                    <DetailRow label="Expediente" value={habilitacion.expte} />
                    <DetailRow label="Transporte" value={habilitacion.tipo_transporte} />
                    <DetailRow label="Vigencia" value={`${new Date(habilitacion.vigencia_inicio).toLocaleDateString()} - ${new Date(habilitacion.vigencia_fin).toLocaleDateString()}`} />
                </InfoSection>

                {(habilitacion.personas || []).length > 0 && (
                    <InfoSection title="Personas Asociadas" icon="users">
                        {(habilitacion.personas || []).map((p: Persona) => (
                            <DetailRow key={p.id} label={p.rol} value={p.nombre} />
                        ))}
                    </InfoSection>
                )}

                {habilitacion.vehiculo && (
                    <InfoSection title="Vehículo" icon="truck">
                        <DetailRow label="Dominio" value={habilitacion.vehiculo.dominio} />
                        <DetailRow label="Marca / Modelo" value={`${habilitacion.vehiculo.marca} ${habilitacion.vehiculo.modelo}`} />
                    </InfoSection>
                )}
                
                {(habilitacion.historial_inspecciones || []).length > 0 && (
                    <InfoSection title="Historial de Inspecciones" icon="clipboard">
                        {(habilitacion.historial_inspecciones || []).map((ins: any) => (
                            <DetailRow key={ins.id} label={new Date(ins.fecha_inspeccion).toLocaleDateString()} value={ins.nombre_inspector} />
                        ))}
                    </InfoSection>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = () => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E1F5FE' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E1F5FE' },
    errorText: { color: '#C62828', fontSize: 16 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? 30 : 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 99,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#01579B',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    mainInfoContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#01579B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0D47A1',
        textAlign: 'center',
    },
    statusChip: {
        marginTop: 12,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 99,
    },
    statusChipText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    card: { 
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#01579B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    cardTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F4F8'
    },
    cardTitle: { 
        fontWeight: 'bold', 
        fontSize: 18,
        color: '#0288D1',
        marginLeft: 10,
    },
    cardContent: {
        padding: 16,
    },
    detailRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingVertical: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: '#F5F5F5'
    },
    detailLabel: { 
        color: '#546E7A',
        fontSize: 15,
    },
    detailValue: { 
        fontWeight: '600', 
        color: '#0D47A1', 
        textAlign: 'right', 
        flexShrink: 1,
        fontSize: 15,
    },
});
