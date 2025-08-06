// app/(contribuyente)/home.tsx

import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking, // NUEVO: Se importa Linking para poder abrir URLs externas
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Importaciones de la aplicación
import { API_LICENSES_URL, API_NOTIFICATIONS_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

// NUEVO: URL base donde se guardan los documentos.
// ¡DEBES CAMBIAR ESTA URL POR LA RUTA REAL A TU CARPETA DE UPLOADS!
const BASE_UPLOADS_URL = 'https://credenciales.transportelanus.com.ar/uploads/documentos_habilitaciones/';

// --- Definición de Tipos ---
type HabilitacionEstado = 'vigente' | 'en tramite' | 'vencido';

interface Habilitacion {
  id: string;
  licencia: string;
  tipo_transporte: string;
  patente: string;
  estado: HabilitacionEstado;
  token: string;
  // MODIFICADO: Se añade el campo opcional para la resolución que viene de la API
  resolucion_url?: string;
}
interface Notification {
  id: string;
  mensaje: string;
  leida: boolean;
}
type IconProps = { color: string };

// --- Íconos SVG (Sin cambios) ---
const CheckCircleIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/><Path d="M22 4L12 14.01l-3-3" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const AlertTriangleIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /><Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const XCircleIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /><Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const LogoutIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const ChevronRightIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const CarIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M14 16.67H9.33a1 1 0 01-1-1V12.33a1 1 0 011-1H14a1 1 0 011 1v3.34a1 1 0 01-1 1z" stroke={color} strokeWidth={2} /><Path d="M10.33 11.33V8.83a2 2 0 012-2h0a2 2 0 012 2v2.5M17.5 16.67h1a1 1 0 001-1V10.83a3 3 0 00-3-3H7.5a3 3 0 00-3 3v4.84a1 1 0 001 1h1m9 0v2m-9-2v2" stroke={color} strokeWidth={2} /></Svg>;
const CalendarIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth={2}/><Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={2} /></Svg>;
const HelpIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} /><Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.01 5h.01" stroke={color} strokeWidth={2} /></Svg>;
const BellIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 01-3.46 0" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const SunIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2"/><Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={color} strokeWidth="2" strokeLinecap="round"/></Svg>;


// --- Componentes de UI ---

const Clock = ({ styles }: { styles: any }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    const formatDate = (date: Date) => {
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

const WeatherInfo = ({ styles }: { styles: any }) => (
    <View style={styles.weatherContainer}>
        <SunIcon color={'#FFFFFF'} />
        <Text style={styles.weatherText}>16°C</Text>
    </View>
);

const AppHeader = ({ name, onLogout, unreadCount, onShowNotifications, styles }: { name: string, onLogout: () => void, unreadCount: number, onShowNotifications: () => void, styles: any }) => (
    <LinearGradient colors={['#29B6F6', '#0288D1']} style={styles.header}>
        <View style={styles.headerTopRow}>
            <Text style={styles.welcomeTitle}>Hola, {name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={onShowNotifications} style={styles.headerButton}>
                    <BellIcon color={'#FFFFFF'} />
                    {unreadCount > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity onPress={onLogout} style={[styles.headerButton, { marginLeft: 12 }]}>
                    <LogoutIcon color={'#FFFFFF'} />
                </TouchableOpacity>
            </View>
        </View>
        <View style={styles.headerInfoContainer}>
            <Clock styles={styles} />
            <WeatherInfo styles={styles} />
        </View>
    </LinearGradient>
);

const LicenseCard = ({ license, styles }: { license: Habilitacion, styles: any }) => {
    const router = useRouter();
    const statusConfig: Record<HabilitacionEstado, { text: string; color: string; icon: React.ReactNode }> = {
        'vigente': { text: 'Vigente', color: '#2E7D32', icon: <CheckCircleIcon color={'#2E7D32'} /> },
        'en tramite': { text: 'En Trámite', color: '#FF8F00', icon: <AlertTriangleIcon color={'#FF8F00'} /> },
        'vencido': { text: 'Vencido', color: '#C62828', icon: <XCircleIcon color={'#C62828'} /> },
    };
    const currentStatus = statusConfig[license.estado] || { text: (license.estado || 'Desconocido').toUpperCase(), color: '#757575', icon: <AlertTriangleIcon color={'#757575'} /> };
    
    // MODIFICADO: Esta función ahora construye la URL completa y la abre.
    const handleResolutionPress = async (fileName: string) => {
        const fullUrl = `${BASE_UPLOADS_URL}${fileName}`;
        try {
            // Verifica si el dispositivo puede abrir la URL
            const supported = await Linking.canOpenURL(fullUrl);
            if (supported) {
                // Abre la URL en el navegador del dispositivo o en un visor de PDF
                await Linking.openURL(fullUrl);
            } else {
                Alert.alert("Error", `No se puede abrir esta URL: ${fullUrl}`);
            }
        } catch (error) {
            Alert.alert("Error", "Ocurrió un problema al intentar abrir el documento.");
            console.error("Linking Error:", error);
        }
    };

    return (
        <View style={styles.licenseCard}>
            <View style={styles.licenseCardHeader}>
                <View style={[styles.licenseIconContainer, { backgroundColor: '#E3F2FD' }]}>
                    <CarIcon color={'#0288D1'} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.licenseTitle}>Licencia N° {license.licencia}</Text>
                    <Text style={styles.licenseSubtitle}>{license.tipo_transporte}</Text>
                </View>
            </View>
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
            
            {/* MODIFICADO: Lógica para mostrar el botón de Resolución si existe la URL */}
            {license.resolucion_url ? (
                // Si hay URL, muestra un botón funcional
                <TouchableOpacity style={styles.infoRow} onPress={() => handleResolutionPress(license.resolucion_url!)}>
                    <Text style={styles.infoLabel}>Resolución</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.infoValue}>Ver documento</Text>
                        <ChevronRightIcon color={'#0288D1'} />
                    </View>
                </TouchableOpacity>
            ) : (
                // Si no hay URL, muestra un texto informativo no-clicable
                <View style={styles.infoRowDisabled}>
                    <Text style={styles.infoLabelDisabled}>Resolución</Text>
                    <Text style={styles.infoValueDisabled}>No disponible</Text>
                </View>
            )}

            <TouchableOpacity style={styles.credentialButton} onPress={() => router.push(`/credential?licenseToken=${license.token}`)}>
                <Text style={styles.credentialButtonText}>Ver Credencial Digital</Text>
                <ChevronRightIcon color={'#0288D1'} />
            </TouchableOpacity>
        </View>
    );
};

const ActionCard = ({ title, subtitle, icon, onPress, styles }: { title: string, subtitle: string, icon: React.ReactNode, onPress: () => void, styles: any }) => (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}>
        <View style={[styles.licenseIconContainer, { backgroundColor: '#E3F2FD' }]}>
            {icon}
        </View>
        <View style={styles.actionCardContent}>
            <Text style={styles.actionCardTitle}>{title}</Text>
            <Text style={styles.actionCardSubtitle}>{subtitle}</Text>
        </View>
        <ChevronRightIcon color={'#90A4AE'} />
    </Pressable>
);

// --- Componente Principal ---
export default function ContribuyenteHomeScreen() {
    const styles = getStyles();
    
    const { session: userSession, signOut } = useAuth();
    const router = useRouter();
    const [licenses, setLicenses] = useState<Habilitacion[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAllData = useCallback(async () => {
        if (userSession?.rol !== 'contribuyente') return;
        setIsLoading(true);
        setError(null);
        try {
            const [licensesRes, notificationsRes] = await Promise.all([
                fetch(`${API_LICENSES_URL}?dni=${userSession.dni}`),
                fetch(`${API_NOTIFICATIONS_URL}?dni=${userSession.dni}`)
            ]);
            const licensesResult = await licensesRes.json();
            const notificationsResult = await notificationsRes.json();

            if (licensesResult.status === 'success') {
                setLicenses(licensesResult.data || []);
            } else {
                throw new Error(licensesResult.message || 'Error al cargar habilitaciones');
            }
            
            if (notificationsResult.status === 'success') {
                setNotifications(notificationsResult.data || []);
            } else {
                console.error("Error cargando notificaciones:", notificationsResult.message);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [userSession]);

    useFocusEffect(useCallback(() => { loadAllData(); }, [loadAllData]));

    const handleHelpPress = () => {
        Alert.alert("Centro de Ayuda", "¿Necesitás asistencia?", [
            { text: "Llamar", onPress: () => Linking.openURL(`tel:43575100,7137`) },
            { text: "Enviar Email", onPress: () => Linking.openURL(`mailto:transporte.lanus@lanus.gob.ar`) },
            { text: "Cancelar", style: "cancel" }
        ]);
    };
    
    const renderContent = () => {
        if (isLoading) return <ActivityIndicator size="large" color={'#0288D1'} style={{ marginTop: 40 }} />;
        if (error) return <Text style={styles.errorText}>{error}</Text>;
        if (licenses.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No se encontraron habilitaciones.</Text>
                    <Text style={styles.emptySubText}>Si crees que es un error, contacta con el Centro de Ayuda.</Text>
                </View>
            );
        }
        return licenses.map(license => (
            <LicenseCard key={license.id || license.licencia} license={license} styles={styles} />
        ));
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader
                name={userSession?.nombre?.split(' ')[0] || 'Usuario'}
                onLogout={signOut}
                unreadCount={notifications.filter(n => !n.leida).length}
                onShowNotifications={() => { /* Lógica para mostrar modal de notificaciones */ }}
                styles={styles}
            />
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>Mis Habilitaciones</Text>
                {renderContent()}

                <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
                <ActionCard 
                    title="Mis Turnos de Inspección"
                    subtitle="Consultá tus próximos turnos"
                    icon={<CalendarIcon color={'#0288D1'} />}
                    onPress={() => router.push('/appointments')}
                    styles={styles}
                />
                <ActionCard 
                    title="Centro de Ayuda"
                    subtitle="Contactate para asistencia"
                    icon={<HelpIcon color={'#0288D1'} />}
                    onPress={handleHelpPress}
                    styles={styles}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

// --- ESTILOS DINÁMICOS ---
const getStyles = () => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E1F5FE' },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 20,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTopRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    welcomeTitle: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: {width: 0, height: 2},
        textShadowRadius: 3
    },
    headerButton: { 
        padding: 10, 
        backgroundColor: 'rgba(255, 255, 255, 0.2)', 
        borderRadius: 99 
    },
    notificationBadge: { 
        position: 'absolute', 
        right: -3, 
        top: -3, 
        backgroundColor: '#D32F2F', 
        borderRadius: 9, 
        width: 18, 
        height: 18, 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#29B6F6'
    },
    notificationBadgeText: { 
        color: 'white', 
        fontSize: 10, 
        fontWeight: 'bold' 
    },
    headerInfoContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 20, 
        paddingTop: 20, 
        borderTopWidth: 1, 
        borderTopColor: 'rgba(255, 255, 255, 0.2)' 
    },
    dateText: { 
        fontSize: 16, 
        color: '#FFFFFF', 
        fontWeight: '600' 
    },
    timeText: { 
        fontSize: 14, 
        color: 'rgba(255, 255, 255, 0.8)' 
    },
    weatherContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8,
    },
    weatherText: { 
        fontSize: 18, 
        color: '#FFFFFF', 
        fontWeight: 'bold' 
    },
    scrollContent: { 
        paddingHorizontal: 20, 
        paddingBottom: 40,
        paddingTop: 24,
    },
    sectionTitle: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        color: '#01579B', 
        marginBottom: 16,
    },
    licenseCard: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 20, 
        marginBottom: 20, 
        shadowColor: '#01579B', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 12, 
        elevation: 5, 
        overflow: 'hidden' 
    },
    licenseCardHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F4F8'
    },
    licenseIconContainer: { 
        padding: 12, 
        borderRadius: 16, 
        marginRight: 16 
    },
    licenseTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#0D47A1' 
    },
    licenseSubtitle: { 
        fontSize: 14, 
        color: '#546E7A', 
        marginTop: 2 
    },
    infoRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: 14, 
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F4F8'
    },
    infoRowDisabled: {
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: 14, 
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F4F8',
        opacity: 0.6,
    },
    infoLabel: { 
        fontSize: 15, 
        color: '#546E7A' 
    },
    infoLabelDisabled: {
        fontSize: 15, 
        color: '#78909C' 
    },
    infoValue: { 
        fontSize: 15, 
        color: '#0D47A1', 
        fontWeight: '600' 
    },
    infoValueDisabled: {
        fontSize: 15, 
        color: '#78909C', 
        fontWeight: '600',
        marginRight: 4,
    },
    statusBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 4, 
        paddingHorizontal: 10, 
        borderRadius: 99 
    },
    statusText: { 
        marginLeft: 6, 
        fontSize: 14, 
        fontWeight: 'bold', 
    },
    credentialButton: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingVertical: 16, 
        backgroundColor: '#F0F4F8'
    },
    credentialButtonText: { 
        fontSize: 16, 
        color: '#0288D1', 
        fontWeight: 'bold',
        marginRight: 8
    },
    actionCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF', 
        padding: 16, 
        borderRadius: 16, 
        marginBottom: 16, 
        shadowColor: '#01579B', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 8, 
        elevation: 3 
    },
    actionCardPressed: { 
        transform: [{ scale: 0.98 }], 
        opacity: 0.9 
    },
    actionCardContent: { 
        flex: 1, 
        gap: 2 
    },
    actionCardTitle: { 
        fontSize: 17, 
        fontWeight: 'bold', 
        color: '#0D47A1' 
    },
    actionCardSubtitle: { 
        fontSize: 14, 
        color: '#546E7A' 
    },
    errorText: { 
        textAlign: 'center', 
        color: '#C62828', 
        padding: 20, 
        fontSize: 16 
    },
    emptyContainer: { 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 20, 
        backgroundColor: '#FFFFFF', 
        borderRadius: 16, 
    },
    emptyText: { 
        textAlign: 'center', 
        color: '#01579B', 
        paddingVertical: 20, 
        fontSize: 16, 
        fontWeight: '600' 
    },
    emptySubText: { 
        textAlign: 'center', 
        color: '#546E7A', 
        marginTop: -10, 
        fontSize: 14, 
        paddingBottom: 20 
    },
});
