// src/components/DynamicHeader.tsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
// 1. Eliminamos la importación de BlurView que no usaremos en esta versión
// import { BlurView } from '@react-native-community/blur'; 
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import Reanimated, {
    interpolate,
    useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- Constantes de Diseño y Animación ---
const HEADER_EXPANDED_HEIGHT = 360;
// Ajustamos la altura colapsada para Android
const HEADER_COLLAPSED_HEIGHT = 120;

// 2. Paleta de Colores actualizada con fondo opaco
const THEME = {
    background: '#EFF6FF', // Fondo opaco de color azul muy claro
    card: '#FFFFFF',
    text: '#1E3A8A',
    textSecondary: '#60A5FA',
    accent: '#3B82F6',
    logoutButton: '#DBEAFE',
};

// --- Helper para Saludo Dinámico ---
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días,";
    if (hour < 19) return "Buenas tardes,";
    return "Buenas noches,";
};

// --- Props del Componente ---
interface DynamicHeaderProps {
    scrollY: Reanimated.SharedValue<number>;
    userSession: { nombre?: string, avatarUrl?: string } | null;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onLogout: () => void;
}

export const DynamicHeader = ({ scrollY, userSession, searchQuery, onSearchChange, onLogout }: DynamicHeaderProps) => {
    const insets = useSafeAreaInsets();
    const greeting = getGreeting();

    // --- Estilos Animados con 'react-native-reanimated' ---
    const headerStyle = useAnimatedStyle(() => {
        const height = interpolate(
            scrollY.value,
            [0, HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT],
            [HEADER_EXPANDED_HEIGHT, HEADER_COLLAPSED_HEIGHT],
            'clamp'
        );
        return { height };
    });

    const summaryStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT - 50],
            [1, 0],
            'clamp'
        );
        const translateY = interpolate(
            scrollY.value,
            [0, HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT],
            [0, -20],
            'clamp'
        );
        return { opacity, transform: [{ translateY }] };
    });
    
    const expandedInfoStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, (HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT) / 2],
            [1, 0],
            'clamp'
        );
        return { opacity };
    });

    const collapsedTitleStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [(HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT) / 2, HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT],
            [0, 1],
            'clamp'
        );
        return { opacity };
    });

    const avatarStyle = useAnimatedStyle(() => {
        const size = interpolate(scrollY.value, [0, HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT], [52, 40], 'clamp');
        return { width: size, height: size, borderRadius: size / 2 };
    });

    const userInitial = userSession?.nombre ? userSession.nombre.substring(0, 1).toUpperCase() : 'U';
    const firstName = userSession?.nombre?.split(' ')[0] || 'Usuario';
    const hasAvatar = !!userSession?.avatarUrl;

    return (
        <Reanimated.View style={[styles.header, { paddingTop: insets.top }, headerStyle]}>
            {/* 3. Quitamos el componente <BlurView> que estaba aquí */}
            
            <View style={styles.topBar}>
                <View style={styles.topBarLeft}>
                    <Reanimated.View style={[styles.avatar, avatarStyle]}>
                        {hasAvatar ? (
                            <Image 
                                source={{ uri: userSession?.avatarUrl }} 
                                style={{ width: '100%', height: '100%', borderRadius: 100 }}
                                resizeMode="cover"
                            />
                        ) : (
                            <Text style={styles.avatarText}>{userInitial}</Text>
                        )}
                    </Reanimated.View>
                    <View style={styles.userInfo}>
                       <Reanimated.View style={[styles.greetingContainer, expandedInfoStyle]}>
                           <Text style={styles.greetingText}>{greeting}</Text>
                           <Text style={styles.userName}>{firstName}</Text>
                       </Reanimated.View>
                       <Reanimated.Text style={[styles.collapsedTitle, collapsedTitleStyle]}>Habilitaciones</Reanimated.Text>
                    </View>
                </View>
                <Pressable onPress={onLogout} style={styles.logoutButton}>
                    <MaterialCommunityIcons name="logout" size={22} color={THEME.text} />
                </Pressable>
            </View>
            
            <Reanimated.View style={summaryStyle}>
                <Text style={styles.expandedSectionTitle}>Acciones Rápidas</Text>
                <View style={styles.quickActionsContainer}>
                    <QuickActionButton icon="chart-bar" text="Estadísticas" onPress={() => router.push('/(admin)/stats' as any)} />
                    <QuickActionButton icon="qrcode-scan" text="Verificar" onPress={() => router.push('/(admin)/scanner' as any)} />
                    <QuickActionButton icon="clipboard-list-outline" text="Inspeccionar" onPress={() => router.push('/(admin)/inspections' as any)} />
                </View>
            </Reanimated.View>
            
            <View style={styles.searchbarContainer}>
                 <Searchbar
                    placeholder="Buscar licencia, titular..."
                    onChangeText={onSearchChange}
                    value={searchQuery}
                    style={styles.searchbar}
                    inputStyle={{ color: THEME.text }}
                    placeholderTextColor={THEME.textSecondary}
                    iconColor={THEME.accent}
                />
            </View>
        </Reanimated.View>
    );
};

const QuickActionButton = ({ icon, text, onPress }: { icon: any, text: string, onPress: () => void }) => (
    <Pressable style={styles.quickActionButton} onPress={onPress}>
        <View style={styles.quickActionIconContainer}>
            <MaterialCommunityIcons name={icon} size={24} color={THEME.accent} />
        </View>
        <Text style={styles.quickActionText}>{text}</Text>
    </Pressable>
);

const styles = StyleSheet.create({
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: THEME.background,
        zIndex: 100,
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: '#DBEAFE',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    topBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    userInfo: {
        marginLeft: 12,
        justifyContent: 'center',
    },
    greetingContainer: {},
    avatar: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: THEME.accent,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.7)',
    },
    avatarText: {
        color: THEME.card,
        fontWeight: 'bold',
        fontSize: 20
    },
    greetingText: {
        fontSize: 16,
        color: THEME.textSecondary,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: THEME.text,
    },
    collapsedTitle: {
        position: 'absolute',
        fontSize: 20,
        fontWeight: 'bold',
        color: THEME.text,
    },
    logoutButton: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: THEME.logoutButton,
    },
    expandedSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: THEME.textSecondary,
        paddingHorizontal: 20,
        marginTop: 24,
        marginBottom: 12
    },
    quickActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        marginTop: 16
    },
    quickActionButton: {
        alignItems: 'center',
    },
    quickActionIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: THEME.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: "#60A5FA",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4.65,
        elevation: 6,
    },
    quickActionText: {
        color: THEME.text,
        fontSize: 12,
        fontWeight: '500',
    },
    searchbarContainer: {
        position: 'absolute',
        bottom: 16,
        left: 20,
        right: 20,
    },
    searchbar: {
        backgroundColor: THEME.card,
        borderRadius: 12,
        shadowColor: "#60A5FA",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});