// app/(admin)/dashboard.tsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Stack, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Reanimated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { SharedElement } from 'react-navigation-shared-element';

import { DynamicHeader } from '../../src/components/DynamicHeader';
import { useAuth } from '../../src/contexts/AuthContext';
import * as api from '../../src/services/api';
import { Habilitacion } from '../../src/types/habilitacion';


// --- Helpers & Funciones de Estilo ---
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

// --- Componentes de UI ---
const StatsCard = ({ icon, label, count, color }: {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    label: string;
    count: number;
    color: string;
}) => (
    <View style={styles.statsCard}>
        <View style={[styles.statsIconContainer, { backgroundColor: `${color}20` }]}>
            <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.statsCount}>{count}</Text>
        <Text style={styles.statsLabel}>{label}</Text>
    </View>
);

const HabilitacionesSummary = ({ data }: { data: Habilitacion[] | undefined }) => {
    const summary = useMemo(() => {
        const initialValue = { habilitado: 0, tramite: 0, vencido: 0 };
        return (data || []).reduce((acc: typeof initialValue, item: Habilitacion) => {
            if (item.estado === 'HABILITADO') acc.habilitado++;
            else if (item.estado === 'EN TRAMITE') acc.tramite++;
            else acc.vencido++;
            return acc;
        }, initialValue);
    }, [data]);

    return (
        <View style={styles.summaryContainer}>
            <StatsCard icon="check-circle" label="Habilitados" count={summary.habilitado} color="#16a34a" />
            <StatsCard icon="clock-outline" label="En Trámite" count={summary.tramite} color="#f59e0b" />
            <StatsCard icon="alert-circle" label="Vencidos" count={summary.vencido} color="#dc2626" />
        </View>
    );
};


const HabilitacionRow = ({ item }: { item: Habilitacion }) => {
    const status = getStatusStyle(item.estado);
    const typeIcon = item.tipo === 'Remis' ? 'taxi' : 'bus-school';

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: `/(admin)/${item.habilitacion_id}` as any,
            params: { item: JSON.stringify(item) }
        });
    };

    return (
        <SharedElement id={`item.${item.habilitacion_id}.card`}>
            <Pressable onPress={handlePress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <View style={[styles.cardBorder, { backgroundColor: status.color }]} />
                <View style={styles.cardContent}>
                    <View style={styles.cardTextContainer}>
                        <View style={styles.cardTitleContainer}>
                            <MaterialCommunityIcons name={typeIcon} size={16} color={styles.cardTitle.color} />
                            <Text style={styles.cardTitle}>{item.nro_licencia}</Text>
                        </View>
                        <Text style={styles.cardSubtitle} numberOfLines={1}>{item.titular_principal || `Exp: ${item.expte}`}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}>
                        <MaterialCommunityIcons name={status.icon as any} size={14} color={status.color} />
                        <Text style={[styles.statusText, { color: status.color }]}>{item.estado}</Text>
                    </View>
                </View>
            </Pressable>
        </SharedElement>
    );
};

const CustomSegmentedButtons = ({ value, onValueChange }: { value: string; onValueChange: (val: 'Escolar' | 'Remis') => void }) => {
    const buttons = [
        { value: 'Escolar', label: 'Escolar', icon: 'bus-school' },
        { value: 'Remis', label: 'Remis', icon: 'taxi' },
    ];
    return (
        <View style={styles.segmentedContainer}>
            {buttons.map(button => (
                <TouchableOpacity key={button.value} style={[styles.segmentedButton, value === button.value && styles.segmentedButtonActive]} onPress={() => onValueChange(button.value as 'Escolar' | 'Remis')} activeOpacity={0.7}>
                    <MaterialCommunityIcons name={button.icon as any} size={20} color={value === button.value ? '#1F2937' : '#4B5563'}/>
                    <Text style={[styles.segmentedButtonText, value === button.value && styles.segmentedButtonTextActive]}>{button.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const SkeletonRow = () => {
    return (
        <View style={[styles.card, { backgroundColor: '#FFFFFF' }]}>
             <View style={[styles.cardBorder, { backgroundColor: '#E0E0E0' }]} />
            <View style={styles.cardContent}>
                <View style={styles.cardTextContainer}>
                    <View style={[styles.skeletonLine, { width: '50%', height: 20, marginBottom: 8 }]} />
                    <View style={[styles.skeletonLine, { width: '80%', height: 16 }]} />
                </View>
                <View style={[styles.skeletonLine, { width: 90, height: 28, borderRadius: 14 }]} />
            </View>
        </View>
    );
};

const SkeletonLoader = () => (
    <View style={{ gap: 16 }}>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
    </View>
);

const EmptyListComponent = () => {
    return (
        <View style={styles.centerContainer}>
            <MaterialCommunityIcons name="folder-search-outline" size={64} color="#9E9E9E" />
            <Text style={styles.emptyText}>No se encontraron habilitaciones</Text>
            <Text style={styles.emptySubtitle}>Intenta ajustar tu búsqueda o los filtros.</Text>
        </View>
    );
};

// --- Componente Principal ---
export default function AdminDashboard() {
    const { userSession, signOut } = useAuth();
    const [tipoTransporte, setTipoTransporte] = useState<'Escolar' | 'Remis'>('Escolar');
    const [searchQuery, setSearchQuery] = useState('');

    // ✨ CORRECCIÓN APLICADA AQUÍ ✨
    const scrollY = useSharedValue(0);

    const { data: habilitaciones, isLoading, error, isFetching } = useQuery({
        queryKey: ['habilitaciones', tipoTransporte, searchQuery],
        queryFn: () => api.getHabilitaciones({ tipo: tipoTransporte, buscar: searchQuery }),
    });

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const onSegmentChange = (value: 'Escolar' | 'Remis') => {
        Haptics.selectionAsync();
        setTipoTransporte(value);
    };

    if (error) {
        return <View style={styles.centerContainer}><Text style={styles.errorText}>Error al cargar los datos.</Text></View>;
    }

    return (
        <View style={styles.flexOne}>
            <Stack.Screen options={{ headerShown: false }} />
            
            <DynamicHeader
                scrollY={scrollY}
                userSession={userSession}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onLogout={async () => {
                    await signOut();
                    router.replace('/login');
                }}
            />

            <Reanimated.FlatList
                data={habilitaciones}
                keyExtractor={(item) => item.habilitacion_id.toString()}
                renderItem={({ item }) => <HabilitacionRow item={item} />}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingTop: 360, paddingBottom: 50 }}
                ListHeaderComponent={
                    <View style={styles.listHeaderContainer}>
                        <HabilitacionesSummary data={habilitaciones} />
                        <CustomSegmentedButtons value={tipoTransporte} onValueChange={onSegmentChange} />
                        {isFetching && !isLoading && <ActivityIndicator style={{ marginVertical: 10 }} color="#111827" />}
                        {isLoading && <SkeletonLoader />}
                    </View>
                }
                ListEmptyComponent={!isLoading ? <EmptyListComponent /> : null}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            />
        </View>
    );
}

// --- Hoja de Estilos ---
const styles = StyleSheet.create({
    flexOne: { flex: 1, backgroundColor: '#F3F4F6' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F3F4F6' },
    errorText: { color: '#B71C1C', fontSize: 16, fontWeight: 'bold' },
    
    listHeaderContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 20,
        marginBottom: 16,
    },

    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    statsCard: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statsIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statsCount: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
    statsLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

    segmentedContainer: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        borderRadius: 12,
        padding: 4,
    },
    segmentedButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 9,
    },
    segmentedButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    segmentedButtonText: { fontSize: 15, fontWeight: '600', color: '#4B5563', marginLeft: 8 },
    segmentedButtonTextActive: { color: '#1F2937' },
    
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        shadowColor: '#9CA3AF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 5,
        marginHorizontal: 20,
    },
    cardPressed: {
        transform: [{ scale: 0.98 }],
        shadowOpacity: 0.1,
    },
    cardBorder: {
        position: 'absolute',
        left: 0,
        top: 12,
        bottom: 12,
        width: 5,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingLeft: 20,
        paddingRight: 12,
    },
    cardTextContainer: { flex: 1, marginRight: 10 },
    cardTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827', marginLeft: 8 },
    cardSubtitle: { fontSize: 14, color: '#4B5563', marginLeft: 29 },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
    },
    statusText: { marginLeft: 6, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },

    skeletonLine: { backgroundColor: '#E5E7EB', borderRadius: 4 },

    emptyText: { color: '#4B5563', fontSize: 18, fontWeight: '600', marginTop: 16 },
    emptySubtitle: { color: '#6B7280', fontSize: 14, marginTop: 4, textAlign: 'center' },
});