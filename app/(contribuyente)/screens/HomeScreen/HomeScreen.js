// =================================================================
// src/screens/HomeScreen/HomeScreen.js - v19 (Encabezado Dinámico y Layout Corregido)
// =================================================================

import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { API_LICENSES_URL, API_NOTIFICATIONS_URL } from '@/constants/api';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

// --- Íconos SVG ---
const CheckCircleIcon = ({ color }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={color} strokeWidth={2} /><Path d="M9 12L11 14L15 10" stroke={color} strokeWidth={2} /></Svg>;
const AlertTriangleIcon = ({ color }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth={2} /><Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={2} /></Svg>;
const XCircleIcon = ({ color }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={color} strokeWidth={2} /><Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth={2} /></Svg>;
const LogoutIcon = ({ color }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color} strokeWidth={2} /><Path d="M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth={2} /></Svg>;
const ChevronRightIcon = ({ color }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2} /></Svg>;
const CarIcon = ({ color }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M14 16.67H9.33a1 1 0 01-1-1V12.33a1 1 0 011-1H14a1 1 0 011 1v3.34a1 1 0 01-1 1z" stroke={color} strokeWidth={2} /><Path d="M10.33 11.33V8.83a2 2 0 012-2h0a2 2 0 012 2v2.5M17.5 16.67h1a1 1 0 001-1V10.83a3 3 0 00-3-3H7.5a3 3 0 00-3 3v4.84a1 1 0 001 1h1m9 0v2m-9-2v2" stroke={color} strokeWidth={2} /></Svg>;
const CalendarIcon = ({ color }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth={2}/><Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={2} /></Svg>
const HelpIcon = ({ color }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M12 22a10 10 0 100-20 10 10 0 000 20zM9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.01 5h.01" stroke={color} strokeWidth={2} /></Svg>;
const BellIcon = ({ color }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 01-3.46 0" stroke={color} strokeWidth={2} /></Svg>;
const SunIcon = ({ color }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2"/><Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={color} strokeWidth="2" strokeLinecap="round"/></Svg>;

// --- Componentes de UI Rediseñados ---

const Clock = ({ styles }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
    };

    return (
        <View>
            <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
            <Text style={styles.timeText}>{currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
    );
};

const WeatherInfo = ({ styles, themeColors }) => (
    <View style={styles.weatherContainer}>
        <SunIcon color={themeColors.textLight} />
        <Text style={styles.weatherText}>16°C</Text>
    </View>
);

const AppHeader = ({ name, onLogout, unreadCount, onShowNotifications, themeColors, styles }) => (
    <LinearGradient colors={[themeColors.primary, themeColors.primaryDark]} style={styles.header}>
        <View style={styles.headerTopRow}>
            <Text style={styles.welcomeTitle}>Hola, {name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={onShowNotifications} style={styles.headerButton}>
                    <BellIcon color={themeColors.textLight} />
                    {unreadCount > 0 && (
                        <View style={[styles.notificationBadge, { borderColor: themeColors.primaryDark }]}>
                            <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity onPress={onLogout} style={styles.headerButton}>
                    <LogoutIcon color={themeColors.textLight} />
                </TouchableOpacity>
            </View>
        </View>
        <View style={styles.headerInfoContainer}>
            <Clock styles={styles} />
            <WeatherInfo styles={styles} themeColors={themeColors} />
        </View>
    </LinearGradient>
);

const LicenseCard = ({ license, navigation, themeColors, styles }) => {
    const statusConfig = {
        vigente: { text: 'VIGENTE', color: themeColors.success, icon: <CheckCircleIcon color={themeColors.success} /> },
        'en tramite': { text: 'EN TRÁMITE', color: themeColors.warning, icon: <AlertTriangleIcon color={themeColors.warning} /> },
        vencido: { text: 'VENCIDO', color: themeColors.error, icon: <XCircleIcon color={themeColors.error} /> },
    };
    const currentStatus = statusConfig[license.estado?.toLowerCase()] || { text: (license.estado || 'DESCONOCIDO').toUpperCase(), color: themeColors.grayMedium, icon: <AlertTriangleIcon color={themeColors.grayMedium} /> };
    
    return (
        <View style={styles.licenseCard}>
            <View style={styles.licenseCardHeader}>
                <View style={[styles.licenseIconContainer, { backgroundColor: `${themeColors.primary}1A` }]}>
                    <CarIcon color={themeColors.primary} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.licenseTitle}>Licencia N° {license.licencia}</Text>
                    <Text style={styles.licenseSubtitle}>{license.tipo_transporte}</Text>
                </View>
            </View>
            <View style={styles.separator} />
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dominio</Text>
                <Text style={styles.infoValue}>{license.patente || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estado</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${currentStatus.color}20` }]}>
                    {currentStatus.icon}
                    <Text style={[styles.statusText, { color: currentStatus.color }]}>{currentStatus.text}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.credentialButton} onPress={() => navigation.navigate('credential', { licenseToken: license.token })}>
                <Text style={styles.credentialButtonText}>Ver Credencial Digital</Text>
                <ChevronRightIcon color={themeColors.primary} />
            </TouchableOpacity>
        </View>
    );
};

const ActionCard = ({ title, subtitle, icon, onPress, styles }) => (
    <Pressable
        onPress={onPress}
        style={({ pressed }) => [
            styles.actionCard,
            pressed && styles.actionCardPressed
        ]}
    >
        {icon}
        <View style={styles.actionCardContent}>
            <Text style={styles.actionCardTitle}>{title}</Text>
            <Text style={styles.actionCardSubtitle}>{subtitle}</Text>
        </View>
        <ChevronRightIcon color={styles.actionCardChevron.color} />
    </Pressable>
);

// --- Componente Principal ---
const HomeScreen = () => {
    // --- ESTADO DEL TEMA Y ESTILOS ---
    const colorScheme = useColorScheme() ?? 'light';
    const lanusTheme = {
      ...Colors[colorScheme],
      primary: '#0093D2', // Celeste principal de Lanús
      primaryDark: '#007AB8', // Un tono más oscuro para el gradiente
      cardBackground: Colors[colorScheme].card,
      grayMedium: Colors[colorScheme].grayMedium,
      border: '#E0E0E0',
    };
    const themeColors = lanusTheme;
    const styles = getStyles(themeColors);
    
    // --- ESTADO Y NAVEGACIÓN ---
    const { userSession, signOut } = useAuth();
    const navigation = useNavigation();
    const [licenses, setLicenses] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // --- LÓGICA DE CARGA DE DATOS ---
    const loadAllData = useCallback(async () => {
        if (!userSession?.dni) return;
        setIsLoading(true);
        setError(null);
        try {
            const [fetchedLicenses, fetchedNotifications] = await Promise.all([
                fetch(`${API_LICENSES_URL}?dni=${userSession.dni}`).then(res => res.json()),
                fetch(`${API_NOTIFICATIONS_URL}?dni=${userSession.dni}`).then(res => res.json())
            ]);

            if (fetchedLicenses.status === 'success') setLicenses(fetchedLicenses.data);
            else throw new Error(fetchedLicenses.message || 'Error al cargar licencias');
            
            if (fetchedNotifications.status === 'success') setNotifications(fetchedNotifications.data);
            else console.error("Error cargando notificaciones:", fetchedNotifications.message);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [userSession]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // --- MANEJADORES DE EVENTOS (HANDLERS) ---
    const handleHelpPress = () => {
        Alert.alert("Centro de Ayuda", "¿Necesitás asistencia?", [
            { text: "Llamar", onPress: () => Linking.openURL(`tel:43575100,7137`) },
            { text: "Enviar Email", onPress: () => Linking.openURL(`mailto:transporte.lanus@lanus.gob.ar`) },
            { text: "Cancelar", style: "cancel" }
        ]);
    };
    
    // --- RENDERIZADO CONDICIONAL DEL CONTENIDO ---
    const renderContent = () => {
        if (isLoading) {
            return <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 40 }} />;
        }
        if (error) {
            return <Text style={styles.errorText}>{error}</Text>;
        }
        if (licenses.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No se encontraron habilitaciones para este DNI.</Text>
                    <Text style={styles.emptySubText}>Si crees que es un error, contactá con el Centro de Ayuda.</Text>
                </View>
            );
        }
        return licenses.map(license => (
            <LicenseCard
                key={license.id || license.licencia}
                license={license}
                navigation={navigation}
                themeColors={themeColors}
                styles={styles}
            />
        ));
    };

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                name={userSession?.nombre?.split(' ')[0] || 'Usuario'}
                onLogout={signOut}
                unreadCount={notifications.filter(n => !n.leida).length}
                onShowNotifications={() => setIsModalVisible(true)}
                themeColors={themeColors}
                styles={styles}
            />
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>Mis Habilitaciones</Text>
                {renderContent()}

                <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
                <ActionCard 
                    title="Mis Turnos de Inspección"
                    subtitle="Consultá y confirmá tus próximos turnos"
                    icon={<CalendarIcon color={themeColors.primary} />}
                    onPress={() => navigation.navigate('appointments')}
                    styles={styles}
                />
                <ActionCard 
                    title="Centro de Ayuda"
                    subtitle="Contactate con nosotros para asistencia"
                    icon={<HelpIcon color={themeColors.primary} />}
                    onPress={handleHelpPress}
                    styles={styles}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

// --- ESTILOS DINÁMICOS ---
const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    welcomeTitle: { fontSize: 28, fontWeight: 'bold', color: colors.textLight },
    headerButton: { marginLeft: 16, padding: 8, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 99 },
    notificationBadge: { position: 'absolute', right: -3, top: -3, backgroundColor: colors.error, borderRadius: 9, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
    notificationBadgeText: { color: colors.textLight, fontSize: 10, fontWeight: 'bold' },
    headerInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    dateText: {
        fontSize: 16,
        color: colors.textLight,
        fontWeight: '600',
    },
    timeText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    weatherContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    weatherText: {
        fontSize: 18,
        color: colors.textLight,
        fontWeight: 'bold',
    },
    scrollContent: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 40 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
    licenseCard: { 
        backgroundColor: colors.cardBackground, 
        borderRadius: 20, 
        marginBottom: 20, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 5 }, 
        shadowOpacity: 0.08, 
        shadowRadius: 15, 
        elevation: 5, 
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        overflow: 'hidden' 
    },
    licenseCardHeader: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    licenseIconContainer: { padding: 16, borderRadius: 16, marginRight: 16 },
    licenseTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    licenseSubtitle: { fontSize: 14, color: colors.grayMedium, marginTop: 2 },
    separator: { height: 1, backgroundColor: colors.border, marginHorizontal: 20 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
    infoLabel: { fontSize: 16, color: colors.grayMedium },
    infoValue: { fontSize: 16, color: colors.text, fontWeight: '600' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99 },
    statusText: { marginLeft: 8, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
    credentialButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 20, borderTopWidth: 1, borderTopColor: colors.border },
    credentialButtonText: { fontSize: 16, color: colors.primary, fontWeight: 'bold' },
    actionCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: colors.cardBackground, 
        padding: 20, 
        borderRadius: 16, 
        marginBottom: 16, 
        borderWidth: 1, 
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    actionCardPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9
    },
    actionCardContent: { flex: 1, marginLeft: 16, gap: 2 },
    actionCardTitle: { fontSize: 17, fontWeight: 'bold', color: colors.text },
    actionCardSubtitle: { fontSize: 14, color: colors.grayMedium },
    actionCardChevron: { color: colors.grayMedium },
    errorText: { textAlign: 'center', color: colors.error, padding: 20, fontSize: 16 },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyText: { textAlign: 'center', color: colors.text, paddingVertical: 20, fontSize: 16, fontWeight: '600' },
    emptySubText: { textAlign: 'center', color: colors.grayMedium, marginTop: -10, fontSize: 14, paddingBottom: 20 },
});

export default HomeScreen;
