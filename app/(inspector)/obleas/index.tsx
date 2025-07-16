import { useNetInfo } from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// --- Iconos ---
const ChevronRightIcon = ({ color, size = 22 }: { color: string, size?: number }) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const TagIcon = ({ color, size = 28 }: { color: string, size?: number }) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L3 13V4h9l7.59 7.59a2 2 0 010 2.82z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M7 7h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const ArrowLeftIcon = ({ color, size = 28 }: { color: string, size?: number }) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><Path d="M19 12H5M12 19l-7-7 7-7" /></Svg>;


// --- Tipos de Datos ---
interface ObleaPendiente {
    id: string;
    nro_licencia: string;
    titular_principal: string;
}

// --- Configuración de API ---
const API_BASE_URL = 'https://api.transportelanus.com.ar/v2'; 

export default function ListaObleasScreen() {
    const netInfo = useNetInfo();
    const router = useRouter();
    const styles = getStyles();

    const [pendientes, setPendientes] = useState<ObleaPendiente[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchObleasPendientes = useCallback(async () => {
        if (!netInfo.isConnected) {
            setError("Necesitas conexión a internet para ver las obleas pendientes.");
            setIsLoading(false);
            return;
        }
        
        console.log("Iniciando fetchObleasPendientes...");
        setIsLoading(true);
        setError(null);

        try {
            const url = `${API_BASE_URL}/obleaslista.php?endpoint=obleas-pendientes`;
            console.log("Llamando a la URL:", url);

            const response = await fetch(url);
            console.log("Respuesta recibida del servidor. Status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error en la respuesta del servidor:", errorText);
                throw new Error(`Error del servidor: ${response.status}`);
            }
            
            const data: ObleaPendiente[] = await response.json();
            console.log("Datos recibidos y parseados correctamente:", data.length, "items.");
            setPendientes(data);

        } catch (e: any) {
            console.error("Error en el bloque try-catch de fetchObleasPendientes:", e);
            setError(`No se pudo cargar la lista: ${e.message}`);
            setPendientes([]);
        } finally {
            console.log("Ejecutando bloque finally. isLoading se establecerá en false.");
            setIsLoading(false);
        }
    }, [netInfo.isConnected]);

    useFocusEffect(useCallback(() => { fetchObleasPendientes(); }, [fetchObleasPendientes]));

    const renderItem = ({ item }: { item: ObleaPendiente }) => (
        <TouchableOpacity style={styles.card} onPress={() => router.push(`/(inspector)/obleas/${item.id}` as any)}>
            <View style={styles.cardIconContainer}><TagIcon color="#0284C7" /></View>
            <View style={styles.cardInfo}>
                <Text style={styles.licenciaText}>{item.nro_licencia}</Text>
                <Text style={styles.titularText}>{item.titular_principal}</Text>
            </View>
            <ChevronRightIcon color="#94A3B8" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.mainContainer}>
            <LinearGradient colors={['#0093D2', '#007AB8']} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeftIcon color="#FFFFFF" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Colocación de Obleas</Text>
                    <Text style={styles.headerSubtitle}>Selecciona una habilitación para continuar</Text>
                </View>
            </LinearGradient>
            {isLoading ? (
                <View style={styles.centeredMessage}>
                    <ActivityIndicator size="large" color="#0093D2" />
                    <Text style={styles.loadingText}>Cargando obleas pendientes...</Text>
                </View>
            ) : error ? (
                <View style={styles.centeredMessage}><Text style={styles.errorText}>{error}</Text></View>
            ) : pendientes.length === 0 ? (
                 <View style={styles.centeredMessage}>
                    <TagIcon color="#94A3B8" size={48} />
                    <Text style={styles.infoText}>¡Todo al día!</Text>
                    <Text style={styles.infoSubtext}>No hay obleas pendientes de colocación.</Text>
                 </View>
            ) : (
                <FlatList
                    data={pendientes}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ padding: 20 }}
                    onRefresh={fetchObleasPendientes}
                    refreshing={isLoading}
                />
            )}
        </SafeAreaView>
    );
}

const getStyles = () => StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#F1F5F9' },
    header: { 
        paddingTop: 70, 
        paddingBottom: 24, 
        paddingHorizontal: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginRight: 16,
        marginLeft: -8,
    },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
    headerSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 },
    centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { fontSize: 16, color: '#DC2626', textAlign: 'center', fontWeight: '500' },
    infoText: { fontSize: 20, color: '#334155', textAlign: 'center', fontWeight: 'bold', marginTop: 16 },
    infoSubtext: { fontSize: 16, color: '#64748B', textAlign: 'center', marginTop: 4 },
    loadingText: { marginTop: 15, fontSize: 16, color: '#64748B' },
    card: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 16, 
        padding: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 16, 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 12, 
        elevation: 5 
    },
    cardIconContainer: { 
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#E0F2FE', 
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16 
    },
    cardInfo: { flex: 1 },
    licenciaText: { fontSize: 17, fontWeight: '600', color: '#1E293B' },
    titularText: { fontSize: 14, color: '#64748B', marginTop: 4 },
});
