import { useNetInfo } from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Linking, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// --- Paleta de Colores y Tema Refinado ---
const theme = {
    background: '#F1F5F9',
    card: '#FFFFFF',
    cardGradient: ['#FFFFFF', '#FDFDFD'] as const,
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    primary: '#0093D2',
    primaryDark: '#0284C7',
    accent: '#E0F2FE',
    error: '#EF4444',
    white: '#FFFFFF',
    shadow: 'rgba(52, 84, 122, 0.2)',
    plateBackground: '#F8FAFC',
    plateBorder: '#E2E8F0',
    skeleton: '#E2E8F0',
    success: '#10B981', // Color para WhatsApp
    disabled: '#9CA3AF', // Color para botones deshabilitados
};

// --- Iconos ---
const ArrowLeftIcon = ({ c, s = 28 }: { c: string, s?: number }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><Path d="M19 12H5M12 19l-7-7 7-7" /></Svg>;
const TagIcon = ({ c, s = 48 }: { c: string, s?: number }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L3 13V4h9l7.59 7.59a2 2 0 010 2.82z" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M7 7h.01" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const WifiOffIcon = ({ c, s = 48 }: { c: string, s?: number }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M1 1l22 22m-9-9a4 4 0 01-4.47-5.53M12 20a11.1 11.1 0 005.5-1.5M4 12.5A11.1 11.1 0 0117 8.5M8.5 4.5A11.1 11.1 0 0120 7.5" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const CarIcon = ({ c, s = 14 }: { c: string, s?: number }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><Path d="M14 16.67H9.33a1 1 0 01-1-1V12.33a1 1 0 011-1H14a1 1 0 011 1v3.34a1 1 0 01-1 1z" /><Path d="M10.33 11.33V8.83a2 2 0 012-2h0a2 2 0 012 2v2.5M17.5 16.67h1a1 1 0 001-1V10.83a3 3 0 00-3-3H7.5a3 3 0 00-3 3v4.84a1 1 0 001 1h1m9 0v2m-9-2v2" /></Svg>;
const VanIcon = ({ c, s = 14 }: { c: string, s?: number }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><Path d="M19 19V6a2 2 0 00-2-2H7a2 2 0 00-2 2v13M5 19h14M10 19v-4h4v4" /><Circle cx="7.5" cy="15.5" r="1.5" /><Circle cx="16.5" cy="15.5" r="1.5" /></Svg>;
const SearchIcon = ({ c, s = 20 }: { c: string, s?: number }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Circle cx="11" cy="11" r="8" /><Path d="M21 21l-4.35-4.35" /></Svg>;
const WhatsAppIcon = ({ c, s = 16 }: { c: string, s?: number }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><Path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></Svg>;

// --- Tipos de Datos ---
interface ObleaPendiente {
    id: string;
    nro_licencia: string;
    titular_principal: string;
    dominio: string;
    telefono: string; // Se espera el teléfono desde la API
}

// --- Lógica de Contenido Inteligente ---
const getVehicleInfo = (licencia: string, dominio: string) => {
    const upperLic = licencia.toUpperCase();
    let vehicleType = { type: 'Vehículo', icon: <CarIcon c={theme.primaryDark} /> };
    if (upperLic.includes('REM')) vehicleType = { type: 'Remis', icon: <CarIcon c={theme.primaryDark} /> };
    if (upperLic.includes('TRA')) vehicleType = { type: 'Transporte', icon: <VanIcon c={theme.primaryDark} /> };
    let formattedDominio = (dominio || 'S/D').toUpperCase();
    if (formattedDominio.length === 7) {
        formattedDominio = `${dominio.slice(0, 2)} ${dominio.slice(2, 5)} ${dominio.slice(5, 7)}`;
    }
    return { ...vehicleType, formattedDominio };
};

// --- Componentes de UI ---
const AnimatedGridItem = ({ item, index, onPress }: { item: ObleaPendiente, index: number, onPress: () => void }) => {
    const styles = getStyles();
    const { type, icon, formattedDominio } = getVehicleInfo(item.nro_licencia, item.dominio);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: index * 90, useNativeDriver: true }).start();
    }, [fadeAnim, index]);

    const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    const handleCardPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    // MODIFICADO: Mensaje de WhatsApp más completo
    const handleWhatsAppPress = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (!item?.telefono) {
            Alert.alert("Sin Teléfono", "El titular no tiene un número de teléfono registrado.");
            return;
        }

        const titular = item.titular_principal.split(' ')[0];
        const dominio = item.dominio;
        const licencia = item.nro_licencia;
        
        const mensaje = `Estimado/a ${titular}, nos comunicamos desde la Dirección Gral. de Movilidad y Transporte del Municipio de Lanús en referencia a su licencia N° ${licencia} para el vehículo con dominio ${dominio}.\n\nNecesitamos coordinar un día y horario para realizar la colocación de la oblea reglamentaria.\n\nPor favor, indíquenos su disponibilidad para agendar un turno.\n\nGracias.`;
        
        const numeroWhatsApp = `549${item.telefono.replace(/[^0-9]/g, '')}`;
        const url = `whatsapp://send?phone=${numeroWhatsApp}&text=${encodeURIComponent(mensaje)}`;

        try {
            await Linking.openURL(url);
        } catch (e) {
            Alert.alert("Error", "No se pudo abrir WhatsApp. Verifique que esté instalado.");
        }
    };

    return (
        <Animated.View style={[styles.gridItem, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient colors={theme.cardGradient} style={styles.card}>
                <Pressable onPress={handleCardPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
                    <View style={styles.cardHeader}>
                        {icon}
                        <Text style={styles.vehicleTypeText}>{type}</Text>
                    </View>
                    <View style={styles.plateContainer}>
                        <Text style={styles.plateText}>{formattedDominio}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.titularText} numberOfLines={2}>{item.titular_principal}</Text>
                        <Text style={styles.licenciaText} numberOfLines={1}>{item.nro_licencia}</Text>
                    </View>
                </Pressable>
                
                <View style={styles.cardActions}>
                     <TouchableOpacity 
                        style={[styles.whatsappButton, !item.telefono && styles.disabledButton]}
                        onPress={handleWhatsAppPress}
                        disabled={!item.telefono}
                        activeOpacity={0.7}
                    >
                        <WhatsAppIcon c={theme.white} s={16} />
                        <Text style={styles.whatsappButtonText}>Contactar</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

const StatusMessage = ({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) => {
    const styles = getStyles();
    return (
        <View style={styles.centeredMessage}>
            <View style={styles.statusContainer}>
                {icon}
                <Text style={styles.infoText}>{title}</Text>
                <Text style={styles.infoSubtext}>{subtitle}</Text>
            </View>
        </View>
    );
};

const SkeletonGridItem = ({ index }: { index: number }) => {
    const styles = getStyles();
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1200,
                delay: index * 150,
                useNativeDriver: true,
            })
        ).start();
    }, [shimmerAnim, index]);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200],
    });

    return (
        <View style={styles.gridItem}>
            <View style={[styles.card, { backgroundColor: theme.card, shadowOpacity: 0.1, elevation: 2 }]}>
                <View style={[styles.skeletonBox, { width: "50%", height: 22, marginBottom: 16 }]} />
                <View style={[styles.skeletonBox, { width: "100%", height: 45, marginBottom: 16 }]} />
                <View style={[styles.skeletonBox, { width: "80%", height: 20, marginBottom: 6 }]} />
                <View style={[styles.skeletonBox, { width: "60%", height: 16 }]} />
                <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
                    <LinearGradient
                        colors={['transparent', 'rgba(226, 232, 240, 0.3)', 'transparent']}
                        start={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </View>
        </View>
    );
};

// --- Pantalla Principal ---
export default function ListaObleasScreen() {
    const router = useRouter();
    const styles = getStyles();
    const netInfo = useNetInfo();
    const [pendientes, setPendientes] = useState<ObleaPendiente[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchObleasPendientes = useCallback(async () => {
        if (pendientes.length === 0) {
            setIsLoading(true);
        }

        if (netInfo.isConnected === false) {
            setError("Sin conexión a internet.");
            setIsLoading(false);
            return;
        }

        setError(null);
        try {
            const url = `https://api.transportelanus.com.ar/v2/obleaslista.php?endpoint=obleas-pendientes`;
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) throw new Error(`Error del servidor`);
            const data: ObleaPendiente[] = await response.json();
            setPendientes(data);
        } catch (e) {
            setError(`No se pudo cargar la lista.`);
            setPendientes([]);
        } finally {
            setIsLoading(false);
        }
    }, [netInfo.isConnected, pendientes.length]);

    useFocusEffect(
        useCallback(() => {
            if (netInfo.isConnected !== null) {
                fetchObleasPendientes();
            }
        }, [netInfo.isConnected, fetchObleasPendientes])
    );

    const filteredPendientes = useMemo(() => {
        if (!searchQuery) return pendientes;
        const lowercasedQuery = searchQuery.toLowerCase();
        return pendientes.filter(item =>
            item.dominio?.toLowerCase().includes(lowercasedQuery) ||
            item.titular_principal?.toLowerCase().includes(lowercasedQuery)
        );
    }, [searchQuery, pendientes]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <FlatList
                    data={Array.from({ length: 6 })}
                    numColumns={2}
                    renderItem={({ index }) => <SkeletonGridItem index={index} />}
                    keyExtractor={(_, index) => index.toString()}
                    contentContainerStyle={styles.gridContainer}
                />
            );
        }
        if (error) return <StatusMessage icon={<WifiOffIcon c={theme.error} />} title="Error de Conexión" subtitle={error} />;
        if (pendientes.length === 0) return <StatusMessage icon={<TagIcon c={theme.textSecondary} />} title="¡Todo al día!" subtitle="No hay obleas pendientes." />;
        if (filteredPendientes.length === 0) return <StatusMessage icon={<SearchIcon c={theme.textSecondary} s={48}/>} title="Sin resultados" subtitle={`No se encontraron habilitaciones para "${searchQuery}"`} />;

        return (
            <FlatList
                data={filteredPendientes}
                numColumns={2}
                renderItem={({ item, index }) => <AnimatedGridItem item={item} index={index} onPress={() => router.push(`/(inspector)/obleas/${item.id}` as any)} />}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.gridContainer}
                onRefresh={fetchObleasPendientes}
                refreshing={isLoading}
            />
        );
    };

    return (
        <SafeAreaView style={styles.mainContainer}>
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeftIcon c={theme.white} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Colocación de Obleas</Text>
                    <Text style={styles.headerSubtitle}>Selecciona una habilitación</Text>
                </View>
            </LinearGradient>
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <SearchIcon c={theme.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por dominio o titular..."
                        placeholderTextColor={theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>
            {renderContent()}
        </SafeAreaView>
    );
}

// --- Estilos ---
const getStyles = () => StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: theme.background },
    header: {
        paddingTop: Platform.OS === 'android' ? 40 : 50,
        paddingBottom: 24,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: { padding: 8, marginRight: 16, marginLeft: -8 },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: theme.white },
    headerSubtitle: { fontSize: 15, color: 'rgba(255, 255, 255, 0.9)', marginTop: 4 },
    searchContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderRadius: 16,
        paddingHorizontal: 16,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchInput: {
        flex: 1,
        height: 50,
        paddingLeft: 12,
        fontSize: 16,
        color: theme.textPrimary,
    },
    centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    statusContainer: { backgroundColor: theme.card, borderRadius: 20, padding: 30, alignItems: 'center', shadowColor: theme.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    infoText: { fontSize: 18, color: theme.textPrimary, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
    infoSubtext: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },
    gridContainer: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 40 },
    gridItem: { flex: 0.5, padding: 8 },
    card: {
        borderRadius: 24,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.8,
        shadowRadius: 22,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: theme.accent,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
        margin: 12,
        marginBottom: 4,
    },
    vehicleTypeText: {
        marginLeft: 6,
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.primaryDark
    },
    plateContainer: {
        backgroundColor: theme.plateBackground,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.plateBorder,
        width: 'auto',
        marginHorizontal: 12,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    plateText: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.textPrimary,
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'AvenirNext-CondensedBold' : 'monospace',
        letterSpacing: 1,
    },
    cardInfo: {
        alignItems: 'center',
        width: 'auto',
        marginHorizontal: 12,
        marginBottom: 12,
        minHeight: 60,
        justifyContent: 'center',
        paddingBottom: 12,
    },
    titularText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.textPrimary,
        textAlign: 'center',
        marginBottom: 4,
    },
    licenciaText: {
        fontSize: 12,
        color: theme.textSecondary,
        textAlign: 'center'
    },
    skeletonBox: {
        backgroundColor: theme.skeleton,
        borderRadius: 8,
        overflow: 'hidden',
    },
    cardActions: {
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: theme.plateBorder,
    },
    whatsappButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.success,
        paddingVertical: 10,
        borderRadius: 12,
    },
    disabledButton: {
        backgroundColor: theme.disabled,
    },
    whatsappButtonText: {
        color: theme.white,
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});
