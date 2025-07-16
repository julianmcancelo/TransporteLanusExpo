// =================================================================
// app/(inspector)/historial/inspeccion/[id].tsx - v2.0 (Funcional con API PHP)
// Muestra el detalle completo de una inspección, incluyendo fotos y firmas.
// =================================================================
import { Feather as Icon } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { InspeccionHistorial } from '../index'; // Reutilizamos el tipo completo

// URL base donde se alojan las imágenes de firmas y fotos.
const IMAGE_BASE_URL = 'https://credenciales.transportelanus.com.ar/';

// --- Componentes de UI Auxiliares ---

const DetailRow = ({ icon, label, value }: { icon: React.ComponentProps<typeof Icon>['name'], label: string, value: string | undefined | null }) => (
    <View style={styles.row}>
        <Icon name={icon} size={20} color="#4a5568" style={styles.rowIcon} />
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || 'No especificado'}</Text>
    </View>
);

const InspectionItemRow = ({ item }: { item: { nombre_item: string, estado: string, observacion: string | null } }) => {
    const getStatusIcon = () => {
        switch (item.estado) {
            case 'ok': return { name: 'check-circle' as const, color: '#38a169' };
            case 'no_ok': return { name: 'x-circle' as const, color: '#e53e3e' };
            default: return { name: 'minus-square' as const, color: '#a0aec0' };
        }
    };
    const statusIcon = getStatusIcon();

    return (
        <View style={styles.itemRow}>
            <Icon name={statusIcon.name} size={22} color={statusIcon.color} />
            <View style={styles.itemTextContainer}>
                <Text style={styles.itemLabel}>{item.nombre_item}</Text>
                {item.observacion && <Text style={styles.itemObservation}>{item.observacion}</Text>}
            </View>
        </View>
    );
};


const InspectionDetailScreen = () => {
    const params = useLocalSearchParams<{ id: string, inspeccionData: string }>();
    const inspeccion: InspeccionHistorial = params.inspeccionData ? JSON.parse(params.inspeccionData) : {};

    const getStatusStyle = (resultado: string) => {
        switch (resultado) {
            case 'Aprobado': return { chip: styles.aprobadoChip, text: styles.aprobadoText, icon: 'check-circle' as const };
            case 'Rechazado': return { chip: styles.rechazadoChip, text: styles.rechazadoText, icon: 'x-circle' as const };
            case 'Condicional': return { chip: styles.condicionalChip, text: styles.condicionalText, icon: 'alert-triangle' as const };
            default: return { chip: styles.defaultChip, text: styles.defaultText, icon: 'help-circle' as const };
        }
    };
    const statusStyle = getStatusStyle(inspeccion.resultado);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Stack.Screen options={{ title: `Inspección #${inspeccion.id}` }} />
            
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Resultado de la Inspección</Text>
                    <View style={[styles.statusChip, statusStyle.chip]}>
                        <Icon name={statusStyle.icon} size={16} color={statusStyle.text.color} />
                        <Text style={[styles.statusText, statusStyle.text]}>{inspeccion.resultado || 'Desconocido'}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Datos Generales</Text>
                <DetailRow icon="hash" label="Número" value={inspeccion.id?.toString()} />
                <DetailRow icon="calendar" label="Fecha y Hora" value={new Date(inspeccion.fecha).toLocaleString('es-AR')} />
                <DetailRow icon="user" label="Inspector" value={inspeccion.inspector_nombre} />
                <DetailRow icon="truck" label="Dominio" value={inspeccion.vehiculo_dominio} />
            </View>
            
            {inspeccion.detalles && inspeccion.detalles.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Ítems Verificados</Text>
                    {inspeccion.detalles.map((item, index) => <InspectionItemRow key={index} item={item} />)}
                </View>
            )}

            {inspeccion.fotos && inspeccion.fotos.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Fotos Adjuntas</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {inspeccion.fotos.map((foto, index) => (
                            <View key={index} style={styles.photoContainer}>
                                <Image source={{ uri: `${IMAGE_BASE_URL}${foto.foto_path}` }} style={styles.photo} />
                                <Text style={styles.photoCaption}>{foto.tipo_foto}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {inspeccion.firma_inspector && inspeccion.firma_contribuyente && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Firmas</Text>
                    <View style={styles.signaturesContainer}>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureLabel}>Firma del Inspector</Text>
                            <Image source={{ uri: `${IMAGE_BASE_URL}${inspeccion.firma_inspector}` }} style={styles.signatureImage} />
                        </View>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureLabel}>Firma del Contribuyente</Text>
                            <Image source={{ uri: `${IMAGE_BASE_URL}${inspeccion.firma_contribuyente}` }} style={styles.signatureImage} />
                        </View>
                    </View>
                </View>
            )}

            {inspeccion.observaciones && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Observaciones</Text>
                    <Text style={styles.observationsText}>{inspeccion.observaciones}</Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    contentContainer: { padding: 16 },
    card: { 
        backgroundColor: '#ffffff', 
        borderRadius: 12,
        padding: 20, 
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    header: { alignItems: 'center', gap: 12 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#4a5568' },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d3748', marginBottom: 16 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingVertical: 4 },
    rowIcon: { marginRight: 12 },
    label: { fontSize: 16, color: '#4a5568', fontWeight: '500' },
    value: { fontSize: 16, color: '#1a202c', flex: 1, textAlign: 'right', fontWeight: '600' },
    statusChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8 },
    statusText: { fontWeight: 'bold', fontSize: 16 },
    aprobadoChip: { backgroundColor: '#e6f4ea' },
    aprobadoText: { color: '#38a169' },
    rechazadoChip: { backgroundColor: '#fdecea' },
    rechazadoText: { color: '#e53e3e' },
    condicionalChip: { backgroundColor: '#fefcbf' },
    condicionalText: { color: '#d69e2e' },
    defaultChip: { backgroundColor: '#e9ecef' },
    defaultText: { color: '#4a5568' },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    itemTextContainer: { marginLeft: 12, flex: 1 },
    itemLabel: { fontSize: 16, color: '#2d3748' },
    itemObservation: { fontSize: 14, color: '#718096', fontStyle: 'italic' },
    photoContainer: { marginRight: 10, alignItems: 'center' },
    photo: { width: 150, height: 150, borderRadius: 8, backgroundColor: '#e9ecef' },
    photoCaption: { marginTop: 4, fontSize: 12, color: '#718096' },
    signaturesContainer: { flexDirection: 'row', justifyContent: 'space-around' },
    signatureBox: { alignItems: 'center', gap: 8 },
    signatureLabel: { fontSize: 14, color: '#4a5568', fontWeight: '500' },
    signatureImage: { width: 120, height: 80, borderRadius: 8, borderWidth: 1, borderColor: '#e9ecef' },
    observationsText: { fontSize: 16, color: '#4a5568', lineHeight: 24 }
});

export default InspectionDetailScreen;
