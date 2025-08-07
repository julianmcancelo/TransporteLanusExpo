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

    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';
import Reanimated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

// --- Componentes y Servicios ---
import { DynamicHeader } from '../../src/components/DynamicHeader';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/hooks/useTheme';
import AppHeader from '@/components/AppHeader';
import * as api from '../../src/services/api';
import { Habilitacion } from '../../src/types/habilitacion';

// --- Componentes UX/UI Mejorados ---
import { AnimatedView, AnimatedCard } from '../../src/components/ui/AnimatedComponents';
import { CardSkeleton, EmptyState } from '../../src/components/ui/LoadingStates';
import { useToast } from '../../src/components/ui/ToastNotification';



// Activar LayoutAnimation para Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Helpers & Funciones de Estilo ---
const getStatusStyle = (estado: string, colors: any) => {
    switch (estado) {
        case 'HABILITADO':
            return { icon: 'check-circle', color: colors.success, backgroundColor: '#ECFDF5' };
        case 'EN TRAMITE':
            return { icon: 'clock-fast', color: colors.warning, backgroundColor: '#FFFBEB' };
        default:
            return { icon: 'alert-circle', color: colors.error, backgroundColor: '#FEF2F2' };
    }
};



// --- Componente Principal ---
// --- Función para generar estilos dinámicos ---
const getStyles = (colors: any) => StyleSheet.create({
    flexOne: { flex: 1, backgroundColor: colors.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.background },
    errorText: { color: colors.error, fontSize: 16, fontWeight: 'bold' },
    
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
        backgroundColor: colors.cardBackground,
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
    statsCount: { fontSize: 28, fontWeight: 'bold', color: colors.text },
    statsLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },

    segmentedContainer: {
        flexDirection: 'row',
        backgroundColor: colors.border,
        borderRadius: 12,
        padding: 4,
    },
    segmentedButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    segmentedButtonActive: {
        backgroundColor: colors.cardBackground,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    segmentedText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    segmentedTextActive: { color: colors.primary },

    habilitacionRow: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        shadowColor: "#94A3B8",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    rowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    licenciaNumber: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    rowContent: { gap: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { fontSize: 14, color: colors.textSecondary, flex: 1 },

    skeletonRow: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    skeleton: {
        backgroundColor: colors.border,
        borderRadius: 8,
    },

    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 16 },

    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: colors.primary,
    },

    // Estilos adicionales para componentes
    card: {
        backgroundColor: colors.cardBackground,
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
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardTextContainer: { flex: 1, marginRight: 10 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    cardSubtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    cardSubtitle: { fontSize: 14, color: colors.textSecondary, marginLeft: 6 },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    segmentedButtonText: { fontSize: 15, fontWeight: 'bold', color: colors.textSecondary, marginLeft: 8 },
    segmentedButtonTextActive: { color: colors.primary },
});

export default function AdminDashboard() {
    const { session: userSession, signOut } = useAuth();
    const { colors, colorScheme } = useTheme();
    const styles = getStyles(colors);
    const [tipoTransporte, setTipoTransporte] = useState<'Escolar' | 'Remis'>('Escolar');
    const [searchQuery, setSearchQuery] = useState('');
    const { showSuccess, showError } = useToast();

    const scrollY = useSharedValue(0);

    // --- Componentes internos con acceso a colors ---
    const StatsCard = ({ icon, label, count, color, delay = 0 }: {
        icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
        label: string;
        count: number;
        color: string;
        delay?: number;
    }) => (
        <AnimatedView 
            animationType="bounceScale" 
            duration={600} 
            delay={delay}
            style={styles.statsCard}
        >
            <View style={[styles.statsIconContainer, { backgroundColor: color }]}>
                <MaterialCommunityIcons name={icon} size={24} color={'#FFFFFF'} />
            </View>
            <Text style={styles.statsCount}>{count}</Text>
            <Text style={styles.statsLabel}>{label}</Text>
        </AnimatedView>
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
                <StatsCard icon="check-circle-outline" label="Habilitados" count={summary.habilitado} color={colors.success} delay={0} />
                <StatsCard icon="clock-outline" label="En Trámite" count={summary.tramite} color={colors.warning} delay={150} />
                <StatsCard icon="close-circle-outline" label="Vencidos" count={summary.vencido} color={colors.error} delay={300} />
            </View>
        );
    };

    const HabilitacionRow = ({ item }: { item: Habilitacion }) => {
        const status = getStatusStyle(item.estado, colors);
        const typeIcon = item.tipo_transporte === 'Remis' ? 'taxi' : 'bus-school';

        const handlePress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            showSuccess('Navegando a detalles', 'Cargando información de la habilitación...');
            router.push({
                pathname: `/(admin)/${item.habilitacion_id}` as any,
                params: { item: JSON.stringify(item) }
            });
        };

        return (
            <AnimatedCard onPress={handlePress} style={styles.card}>
                <View style={[styles.cardBorder, { backgroundColor: status.color }]} />
                <View style={styles.cardContent}>
                    <View style={styles.cardIconType}>
                        <MaterialCommunityIcons name={typeIcon} size={22} color={colors.primary} />
                    </View>
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>{item.nro_licencia}</Text>
                        <View style={styles.cardSubtitleContainer}>
                            <MaterialCommunityIcons name="account-circle-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.cardSubtitle} numberOfLines={1}>{item.titular_principal || `Exp: ${item.expte}`}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}>
                        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                        <Text style={[styles.statusText, { color: status.color }]}>{item.estado}</Text>
                    </View>
                </View>
            </AnimatedCard>
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
                        <MaterialCommunityIcons name={button.icon as any} size={20} color={value === button.value ? colors.primary : colors.textSecondary}/>
                        <Text style={[styles.segmentedButtonText, value === button.value && styles.segmentedButtonTextActive]}>{button.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const SkeletonLoader = () => (
        <View style={{ gap: 16 }}>
            <CardSkeleton showAvatar={true} lines={2} />
            <CardSkeleton showAvatar={true} lines={2} />
            <CardSkeleton showAvatar={true} lines={2} />
        </View>
    );

    const EmptyListComponent = () => {
        return (
            <EmptyState
                title="No se encontraron habilitaciones"
                message="Intenta ajustar tu búsqueda o los filtros para encontrar más resultados."
                actionLabel="Limpiar filtros"
                onActionPress={() => {
                    setSearchQuery('');
                    showSuccess('Filtros limpiados', 'Mostrando todas las habilitaciones');
                }}
            />
        );
    };

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

    // Android-specific container style to ensure content is below status bar
    const androidContainerStyle = {
        flex: 1,
        backgroundColor: colors.background,
        ...(Platform.OS === 'android' && {
            paddingTop: StatusBar.currentHeight || 0,
        })
    };

    if (error) {
        showError('Error de conexión', 'No se pudieron cargar las habilitaciones. Verifica tu conexión a internet.');
        return (
            <View style={androidContainerStyle}>
                <StatusBar 
                    barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
                    backgroundColor={colors.background} 
                    translucent={false}
                />
                <SafeAreaView style={styles.centerContainer}>
                    <EmptyState
                        title="Error al cargar datos"
                        message="No se pudieron cargar las habilitaciones. Verifica tu conexión a internet."
                        actionLabel="Reintentar"
                        onActionPress={() => window.location.reload()}
                    />
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={androidContainerStyle}>
            <StatusBar 
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
                backgroundColor={colors.background} 
                translucent={false}
            />
            <SafeAreaView style={styles.flexOne}>
                <AppHeader user={userSession} onLogout={signOut} />
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
                        {isFetching && !isLoading && <ActivityIndicator style={{ marginVertical: 10 }} color={colors.primary} />}
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
            />
            </SafeAreaView>
        </View>
    );
}


