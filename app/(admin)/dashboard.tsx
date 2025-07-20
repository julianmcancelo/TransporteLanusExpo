// app/(admin)/dashboard.tsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';

import { useAuth } from '../../src/contexts/AuthContext';
import * as api from '../../src/services/api';
import { Habilitacion } from '../../src/types/habilitacion';

// --- Íconos ---
const UserIcon = ({ color }: { color: string }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="2.5"/><Path d="M12 7a4 4 0 100-8 4 4 0 000 8z" stroke={color} strokeWidth="2.5"/></Svg>;

// --- Componentes de UI ---

const getStatusStyle = (estado: string) => {
    switch (estado) {
        case 'HABILITADO':
            return { icon: 'check-circle', color: '#16a34a', backgroundColor: '#f0fdf4' };
        case 'EN TRAMITE':
            return { icon: 'clock-outline', color: '#f59e0b', backgroundColor: '#fefce8' };
        default:
            return { icon: 'alert-circle', color: '#dc2626', backgroundColor: '#fef2f2' };
    }
};

const HabilitacionRow = ({ item }: { item: Habilitacion }) => {
    const status = getStatusStyle(item.estado);
    const styles = getStyles();

    return (
        <Pressable onPress={() => router.push(`/(admin)/${item.habilitacion_id}` as any)} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
            <View style={styles.cardContent}>
                <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>{item.nro_licencia}</Text>
                    <Text style={styles.cardSubtitle}>{item.titular_principal || `Exp: ${item.expte}`}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}>
                    <MaterialCommunityIcons name={status.icon as any} size={14} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{item.estado}</Text>
                </View>
            </View>
        </Pressable>
    );
};

const CustomSegmentedButtons = ({ value, onValueChange }: { value: string, onValueChange: (val: string) => void }) => {
    const styles = getStyles();
    const buttons = [
        { value: 'Escolar', label: 'Escolar', icon: 'bus-school' },
        { value: 'Remis', label: 'Remis', icon: 'taxi' },
    ];

    return (
        <View style={styles.segmentedContainer}>
            {buttons.map(button => (
                <TouchableOpacity 
                    key={button.value} 
                    style={[styles.segmentedButton, value === button.value && styles.segmentedButtonActive]}
                    onPress={() => onValueChange(button.value)}
                >
                    <MaterialCommunityIcons 
                        name={button.icon as any} 
                        size={20} 
                        color={value === button.value ? '#FFFFFF' : '#0288D1'} 
                    />
                    <Text style={[styles.segmentedButtonText, value === button.value && styles.segmentedButtonTextActive]}>
                        {button.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};


export default function AdminDashboard() {
    const { userSession } = useAuth();
    const [tipoTransporte, setTipoTransporte] = useState<'Escolar' | 'Remis' | 'Demo'>('Escolar');
    const [searchQuery, setSearchQuery] = useState('');
    const styles = getStyles();

    const { data: habilitaciones, isLoading, error } = useQuery({
        queryKey: ['habilitaciones', tipoTransporte, searchQuery],
        queryFn: () => api.getHabilitaciones({ tipo: tipoTransporte, buscar: searchQuery }),
    });

    if (error) {
        return <View style={styles.centerContainer}><Text style={styles.errorText}>Error al cargar los datos.</Text></View>;
    }

    const userInitial = userSession?.nombre ? userSession.nombre.substring(0, 1).toUpperCase() : 'U';

    return (
        <SafeAreaView style={styles.flexOne}>
            <Stack.Screen options={{ headerShown: false }} />
            <FlatList
                data={habilitaciones}
                keyExtractor={(item) => item.habilitacion_id.toString()}
                renderItem={({ item }) => <HabilitacionRow item={item} />}
                ListHeaderComponent={
                    <>
                        <LinearGradient colors={['#E1F5FE', '#B3E5FC']} style={styles.headerGradient}>
                            <View style={styles.headerContainer}>
                                <View style={styles.headerTopRow}>
                                    <View>
                                        <Text style={styles.headerSubtitle}>Bienvenido,</Text>
                                        <Text style={styles.headerTitle}>{userSession?.nombre?.split(' ')[0]}</Text>
                                    </View>
                                    <View style={[styles.avatar, { backgroundColor: '#0288D1' }]}>
                                        <Text style={styles.avatarText}>{userInitial}</Text>
                                    </View>
                                </View>
                                <Searchbar 
                                    placeholder="Buscar por licencia o titular..." 
                                    onChangeText={setSearchQuery} 
                                    value={searchQuery} 
                                    style={styles.searchbar}
                                    iconColor='#0288D1'
                                />
                            </View>
                        </LinearGradient>

                        <View style={styles.filterContainer}>
                             <CustomSegmentedButtons
                                value={tipoTransporte}
                                onValueChange={(value) => setTipoTransporte(value as any)}
                            />
                        </View>
                        {isLoading && <ActivityIndicator animating={true} size="large" color="#0288D1" style={styles.loadingIndicator} />}
                    </>
                }
                ListEmptyComponent={!isLoading ? (
                    <View style={styles.centerContainer}><Text style={styles.emptyText}>No se encontraron habilitaciones.</Text></View>
                ) : null}
                contentContainerStyle={styles.listContentContainer}
            />
            <TouchableOpacity 
                style={styles.fab} 
                onPress={() => Alert.alert('Nueva Habilitación', 'Aquí se abriría el formulario para crear un nuevo registro.')}
            >
                <MaterialCommunityIcons name="plus" size={24} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const getStyles = () => StyleSheet.create({
    flexOne: { flex: 1, backgroundColor: '#E1F5FE' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    headerGradient: { 
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        borderBottomLeftRadius: 30, 
        borderBottomRightRadius: 30 
    },
    headerContainer: { 
        paddingHorizontal: 20, 
        paddingTop: 20, 
        paddingBottom: 40 
    },
    headerTopRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20 
    },
    headerTitle: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: '#01579B' 
    },
    headerSubtitle: { 
        fontSize: 16, 
        color: '#01579B' 
    },
    avatar: { 
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
    },
    searchbar: { 
        backgroundColor: 'white', 
        borderRadius: 16,
        shadowColor: "#01579B",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    filterContainer: { 
        paddingHorizontal: 20, 
        marginTop: -20, 
        marginBottom: 10 
    },
    loadingIndicator: { marginVertical: 32 },
    listContentContainer: { 
        paddingHorizontal: 16, 
        paddingBottom: 80, 
        flexGrow: 1 
    },
    emptyText: { color: '#546E7A', fontSize: 16 },
    errorText: { color: '#C62828', fontSize: 16 },
    card: {
        marginBottom: 12,
        backgroundColor: 'white',
        borderRadius: 16,
        shadowColor: '#01579B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    cardPressed: {
        transform: [{ scale: 0.98 }]
    },
    cardContent: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16 
    },
    cardTextContainer: { flex: 1 },
    cardTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#0D47A1' 
    },
    cardSubtitle: { 
        fontSize: 14, 
        color: '#546E7A', 
        marginTop: 2 
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
    },
    statusText: { 
        marginLeft: 6, 
        fontSize: 12, 
        fontWeight: 'bold' 
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#0288D1',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#01579B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    segmentedContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 16,
        padding: 4,
    },
    segmentedButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 12,
    },
    segmentedButtonActive: {
        backgroundColor: '#0288D1',
        shadowColor: '#01579B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    segmentedButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#0288D1',
        marginLeft: 8,
    },
    segmentedButtonTextActive: {
        color: '#FFFFFF',
    },
});
