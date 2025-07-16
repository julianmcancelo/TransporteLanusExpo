// =================================================================
// app/(inspector)/historial/[licencia].tsx - v1.1
// Muestra la lista de inspecciones para una licencia/dominio.
// =================================================================
import { Feather as Icon } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { InspeccionHistorial } from './index'; // Importamos el tipo desde la pantalla de búsqueda

const HistorialResultsScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams<{ licencia: string, historial: string }>();
    const { licencia } = params;
    const historial: InspeccionHistorial[] = params.historial ? JSON.parse(params.historial) : [];

    const getStatusStyle = (resultado: string) => {
        switch (resultado) {
            case 'Aprobado': return styles.aprobado;
            case 'Rechazado': return styles.rechazado;
            case 'Condicional': return styles.condicional;
            default: return {};
        }
    };
    
    const renderItem = ({ item }: { item: InspeccionHistorial }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push({
                // CORRECCIÓN: Se usa la ruta explícita para ser compatible con rutas tipadas
                pathname: '/(inspector)/historial/inspeccion/[id]',
                params: { 
                    id: item.id.toString(),
                    inspeccionData: JSON.stringify(item) 
                }
            })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Inspección #{item.id}</Text>
                <View style={[styles.statusBadge, getStatusStyle(item.resultado)]}>
                    <Text style={styles.statusText}>{item.resultado}</Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardText}><Icon name="calendar" size={14} /> Fecha: {new Date(item.fecha).toLocaleDateString('es-AR')}</Text>
                <Text style={styles.cardText}><Icon name="user" size={14} /> Inspector: {item.inspector_nombre}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: `Historial: ${licencia}` }} />
            {historial.length > 0 ? (
                <FlatList
                    data={historial}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Icon name="file-text" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>No se encontraron inspecciones para el dominio {licencia}.</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7f9' },
    list: { padding: 10 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    cardBody: { gap: 5 },
    cardText: { fontSize: 15, color: '#555', },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
    statusText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    aprobado: { backgroundColor: '#28a745' },
    rechazado: { backgroundColor: '#dc3545' },
    condicional: { backgroundColor: '#ffc107' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { fontSize: 18, color: '#888', textAlign: 'center', marginTop: 20 },
});

export default HistorialResultsScreen;
