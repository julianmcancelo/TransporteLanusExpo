import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FAB } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Stack, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    LayoutAnimation,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';
import Reanimated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

// --- Componentes y Servicios ---
import { DynamicHeader } from '../../src/components/DynamicHeader'; // Asumimos que este componente ya existe
import { useAuth } from '../../src/contexts/AuthContext';
import * as api from '../../src/services/api';
import { Habilitacion } from '../../src/types/habilitacion';

// --- Paleta de Colores para el Nuevo Diseño ---
const theme = {
    background: '#F8FAFC', // Un fondo casi blanco para que resalten las tarjetas
    card: '#FFFFFF',
    textPrimary: '#0F172A', // Un gris oscuro, casi negro
    textSecondary: '#64748B', // Gris medio para subtítulos
    primary: '#0EA5E9', // Celeste vibrante (sky-500)
    primaryDark: '#0284C7', // Celeste más oscuro (sky-600)
    accent: '#E0F2FE', // Un celeste muy claro para fondos de íconos (sky-100)
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    skeleton: '#F1F5F9',
};

// Activar LayoutAnimation para Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Helpers & Funciones de Estilo ---
const getStatusStyle = (estado: string) => {
    switch (estado) {
        case 'HABILITADO':
            return { icon: 'check-circle', color: theme.success, backgroundColor: '#ECFDF5' };
        case 'EN TRAMITE':
            return { icon: 'clock-fast', color: theme.warning, backgroundColor: '#FFFBEB' };
        default:
            return { icon: 'alert-circle', color: theme.error, backgroundColor: '#FEF2F2' };
    }
};

// --- Componentes de UI Rediseñados ---

const StatsCard = ({ icon, label, count, color }: {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    label: string;
    count: number;
    color: string;
}) => (
    <View style={styles.statsCard}>
        <View style={[styles.statsIconContainer, { backgroundColor: color }]}>
            <MaterialCommunityIcons name={icon} size={24} color={'#FFFFFF'} />
        </View>
        <Text style={styles.statsCount}>{count}</Text>
        <Text style={styles.statsLabel}>{label}</Text>
    </View>
);

const HabilitacionesSummary = ({ data }: { data: Habilitacion[] | undefined }) => {
    const summary = useMemo(() => {
        const initialValue = { habilitado: 0, tramite: 0, vencido: 0 };
        return (data || []).reduce((acc, item) => {
            if (item.estado === 'HABILITADO') acc.habilitado++;
            else if (item.estado === 'EN TRAMITE') acc.tramite++;
            else acc.vencido++;
            return acc;
        }, initialValue);
    }, [data]);

    return (
        <View style={styles.summaryContainer}>
            <StatsCard icon="check-circle-outline" label="Habilitados" count={summary.habilitado} color={theme.success} />
            <StatsCard icon="clock-outline" label="En Trámite" count={summary.tramite} color={theme.warning} />
            <StatsCard icon="close-circle-outline" label="Vencidos" count={summary.vencido} color={theme.error} />
        </View>
    );
};

const HabilitacionRow = ({ item }: { item: Habilitacion }) => {
    const status = getStatusStyle(item.estado);
    const typeIcon = item.tipo_transporte === 'Remis' ? 'taxi' : 'bus-school';

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: `/(admin)/${item.habilitacion_id}` as any,
            params: { item: JSON.stringify(item) }
        });
    };

    // CORRECCIÓN: Se elimina el Reanimated.View con sharedTransitionTag que causaba el freeze.
    return (
        <Pressable onPress={handlePress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
            <View style={[styles.cardBorder, { backgroundColor: status.color }]} />
            <View style={styles.cardContent}>
                <View style={styles.cardIconType}>
                    <MaterialCommunityIcons name={typeIcon} size={22} color={theme.primary} />
                </View>
                <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>{item.nro_licencia}</Text>
                    <View style={styles.cardSubtitleContainer}>
                        <MaterialCommunityIcons name="account-circle-outline" size={16} color={theme.textSecondary} />
                        <Text style={styles.cardSubtitle} numberOfLines={1}>{item.titular_principal || `Exp: ${item.expte}`}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}>
                    <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                    <Text style={[styles.statusText, { color: status.color }]}>{item.estado}</Text>
                </View>
            </View>
        </Pressable>
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
                <TouchableOpacity key={button.value} style={[styles.segmentedButton, value === button.value && styles.segmentedButtonActive]} onPress={() => onValueChange(button.value as 'Escolar' | 'Remis')} activeOpacity={0.8}>
                    <MaterialCommunityIcons name={button.icon as any} size={20} color={value === button.value ? theme.primaryDark : theme.textSecondary}/>
                    <Text style={[styles.segmentedButtonText, value === button.value && styles.segmentedButtonTextActive]}>{button.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const SkeletonRow = () => {
    return (
        <View style={[styles.card, { backgroundColor: '#FFFFFF' }]}>
             <View style={[styles.cardBorder, { backgroundColor: theme.skeleton }]} />
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
            <MaterialCommunityIcons name="folder-search-outline" size={64} color="#CBD5E1" />
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

    const scrollY = useSharedValue(0);

    const { data: habilitaciones, isLoading, error, isFetching } = useQuery({
        queryKey: ['habilitaciones', tipoTransporte, searchQuery],
        queryFn: () => api.getHabilitaciones({ tipo: tipoTransporte, buscar: searchQuery }),
    });

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const onSegmentChange = (value: 'Escolar' | 'Remis') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
                        {isFetching && !isLoading && <ActivityIndicator style={{ marginVertical: 10 }} color={theme.primary} />}
                        {isLoading && <SkeletonLoader />}
                    </View>
                }
                ListEmptyComponent={!isLoading ? <EmptyListComponent /> : null}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            />
            <FAB
                icon="cog-outline"
                style={styles.fab}
                onPress={() => router.push('/(admin)/ajustes')}
                color={theme.card}
            />
        </View>
    );
}

// --- Hoja de Estilos ---
const styles = StyleSheet.create({
    flexOne: { flex: 1, backgroundColor: theme.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: theme.background },
    errorText: { color: theme.error, fontSize: 16, fontWeight: 'bold' },
    
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
        backgroundColor: theme.card,
        borderRadius: 20,
        padding: 16,
        shadowColor: "#94A3B8",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    statsIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    statsCount: { fontSize: 28, fontWeight: 'bold', color: theme.textPrimary },
    statsLabel: { fontSize: 13, color: theme.textSecondary, fontWeight: '600' },

    segmentedContainer: {
        flexDirection: 'row',
        backgroundColor: '#E2E8F0',
        borderRadius: 16,
        padding: 6,
    },
    segmentedButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    segmentedButtonActive: {
        backgroundColor: theme.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    segmentedButtonText: { fontSize: 15, fontWeight: 'bold', color: theme.textSecondary, marginLeft: 8 },
    segmentedButtonTextActive: { color: theme.primaryDark },
    
    card: {
        backgroundColor: theme.card,
        borderRadius: 16,
        shadowColor: '#94A3B8',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 3,
        marginHorizontal: 20,
    },
    cardPressed: {
        transform: [{ scale: 0.98 }],
        shadowOpacity: 0.02,
    },
    cardBorder: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 6,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingLeft: 12,
    },
    cardIconType: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardTextContainer: { flex: 1, marginRight: 10 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: theme.textPrimary },
    cardSubtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    cardSubtitle: { fontSize: 14, color: theme.textSecondary, marginLeft: 6 },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: { marginLeft: 6, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },

    skeletonLine: { backgroundColor: theme.skeleton, borderRadius: 4 },

    emptyText: { color: theme.textPrimary, fontSize: 18, fontWeight: '600', marginTop: 16 },
    emptySubtitle: { color: theme.textSecondary, fontSize: 14, marginTop: 4, textAlign: 'center' },
    fab: {
        position: 'absolute',
        margin: 24,
        right: 0,
        bottom: 0,
        backgroundColor: theme.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
});
