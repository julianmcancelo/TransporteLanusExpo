// app/(contribuyente)/appointments.tsx

/// <reference types="expo-router/types" />

import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { API_APPOINTMENTS_URL, API_CONFIRM_APPOINTMENT_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

// --- DEFINICIÓN DE TIPOS ---
interface Appointment {
  id: number;
  fecha: string;
  hora: string;
  estado: string;
  observaciones: string | null;
  nro_licencia: string;
  tipo_transporte: string;
}

type IconProps = { color: string; };
type AppointmentCardProps = {
  appointment: Appointment;
  onConfirm: (turnoId: number) => void;
  styles: ReturnType<typeof getStyles>;
};

// --- Iconos ---
const CalendarDayIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const ClockIcon = ({ color }: IconProps) => <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const BackIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const CheckIcon = ({ color }: IconProps) => <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></Svg>;

// --- Componente para cada tarjeta de turno ---
const AppointmentCard = ({ appointment, onConfirm, styles }: AppointmentCardProps) => {
    const getStatusStyle = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMADO': return { badge: styles.badgeSuccess, text: styles.textSuccess, label: 'Confirmado' };
            case 'PENDIENTE': return { badge: styles.badgeWarning, text: styles.textWarning, label: 'Pendiente' };
            case 'CANCELADO':
            case 'ANULADO': return { badge: styles.badgeError, text: styles.textError, label: 'Anulado' };
            default: return { badge: styles.badgeGray, text: styles.textGray, label: status };
        }
    };

    const statusStyle = getStatusStyle(appointment.estado);
    const date = new Date(`${appointment.fecha}T${appointment.hora}`);
    const day = date.toLocaleDateString('es-AR', { day: '2-digit' });
    const month = date.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase();
    
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.dateContainer}>
                    <Text style={styles.dateDay}>{day}</Text>
                    <Text style={styles.dateMonth}>{month}</Text>
                </View>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>{appointment.tipo_transporte}</Text>
                    <Text style={styles.headerSubtitle}>Licencia N° {appointment.nro_licencia}</Text>
                </View>
                <View style={[styles.statusBadge, statusStyle.badge]}>
                    <Text style={[styles.statusText, statusStyle.text]}>{statusStyle.label}</Text>
                </View>
            </View>
            
            <View style={styles.cardBody}>
                <View style={styles.detailRow}>
                    <CalendarDayIcon color="#546E7A" />
                    <Text style={styles.detailValue}>{date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                </View>
                <View style={styles.detailRow}>
                    <ClockIcon color="#546E7A" />
                    <Text style={styles.detailValue}>{date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</Text>
                </View>
                {appointment.observaciones &&
                    <View style={styles.observationBox}>
                        <Text style={styles.observationText}>{appointment.observaciones}</Text>
                    </View>
                }
            </View>

            {appointment.estado?.toUpperCase() === 'PENDIENTE' && (
                <TouchableOpacity style={styles.confirmButton} onPress={() => onConfirm(appointment.id)}>
                    <CheckIcon color="#FFFFFF" />
                    <Text style={styles.confirmButtonText}>Confirmar Turno</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

// --- Pantalla Principal de Turnos ---
export default function AppointmentsScreen() {
    const router = useRouter();
    const { userSession, isSessionLoading } = useAuth();
    const styles = getStyles();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAppointments = useCallback(async () => {
        if (!userSession || userSession.rol !== 'contribuyente') {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_APPOINTMENTS_URL}?dni=${userSession.dni}`);
            const result = await response.json();
            if (result.status === 'success') {
                setAppointments(result.data || []);
            } else {
                Alert.alert('Error', result.message || 'No se pudieron cargar los turnos.');
            }
        } catch (error) {
            Alert.alert('Error de Conexión', 'No se pudo conectar al servidor.');
        } finally {
            setIsLoading(false);
        }
    }, [userSession]);
    
    useFocusEffect(useCallback(() => { 
        if (!isSessionLoading) {
            fetchAppointments();
        }
    }, [isSessionLoading, fetchAppointments]));

    const handleConfirmAppointment = (turnoId: number) => {
        Alert.alert(
            "Confirmar Turno",
            "¿Estás seguro de que deseas confirmar este turno? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sí, Confirmar",
                    onPress: async () => {
                        try {
                            const response = await fetch(API_CONFIRM_APPOINTMENT_URL, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ turno_id: turnoId })
                            });
                            const result = await response.json();
                            if (result.status === 'success') {
                                Alert.alert('¡Éxito!', 'Tu turno ha sido confirmado.');
                                fetchAppointments();
                            } else {
                                Alert.alert('Error', result.message || 'No se pudo confirmar el turno.');
                            }
                        } catch (error) {
                            Alert.alert('Error de Conexión', 'No se pudo conectar al servidor para confirmar.');
                        }
                    },
                },
            ]
        );
    };

    const renderContent = () => {
        if (isLoading || isSessionLoading) {
            return <ActivityIndicator size="large" color={'#0288D1'} style={styles.centered} />;
        }
        
        if (userSession?.rol !== 'contribuyente') {
            return <Text style={styles.emptyText}>Esta sección es solo para contribuyentes.</Text>;
        }

        if (appointments.length === 0) {
            return <Text style={styles.emptyText}>No tienes turnos programados.</Text>;
        }
        
        return (
            <FlatList
                data={appointments}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <AppointmentCard appointment={item} onConfirm={handleConfirmAppointment} styles={styles} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient colors={['#E1F5FE', '#B3E5FC']} style={StyleSheet.absoluteFill} />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <BackIcon color="#01579B" />
                </TouchableOpacity>
                <Text style={styles.title}>Mis Turnos</Text>
                <View style={{ width: 40 }} />
            </View>

            {renderContent()}
        </SafeAreaView>
    );
};

// --- Estilos Dinámicos ---
const getStyles = () => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E1F5FE' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? 30 : 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 99,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#01579B',
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingHorizontal: 20, paddingBottom: 20 },
    card: { 
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
    cardHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F4F8'
    },
    dateContainer: {
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
        minWidth: 55,
    },
    dateDay: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0288D1',
    },
    dateMonth: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0288D1',
    },
    headerTextContainer: { 
        flex: 1,
        marginLeft: 16 
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#0D47A1',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#546E7A',
    },
    cardBody: { 
        paddingVertical: 10,
        paddingHorizontal: 20 
    },
    detailRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 10,
        gap: 12,
    },
    detailValue: { 
        fontSize: 15, 
        fontWeight: '500', 
        color: '#37474F' 
    },
    observationBox: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
        marginTop: 10,
    },
    observationText: { 
        fontSize: 14, 
        color: '#546E7A', 
        fontStyle: 'italic',
        lineHeight: 20,
    },
    statusBadge: { 
        paddingHorizontal: 10, 
        paddingVertical: 5, 
        borderRadius: 99 
    },
    statusText: { 
        fontSize: 12, 
        fontWeight: 'bold', 
        textTransform: 'uppercase' 
    },
    badgeSuccess: { backgroundColor: 'rgba(46, 125, 50, 0.1)' },
    textSuccess: { color: '#2E7D32' },
    badgeWarning: { backgroundColor: 'rgba(255, 143, 0, 0.1)' },
    textWarning: { color: '#FF8F00' },
    badgeError: { backgroundColor: 'rgba(198, 40, 40, 0.1)' },
    textError: { color: '#C62828' },
    badgeGray: { backgroundColor: '#ECEFF1' },
    textGray: { color: '#546E7A' },
    confirmButton: { 
        backgroundColor: '#2E7D32', 
        paddingVertical: 15, 
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    confirmButtonText: { 
        color: '#FFFFFF', 
        fontSize: 16, 
        fontWeight: 'bold' 
    },
    emptyText: { 
        textAlign: 'center', 
        marginTop: 50, 
        fontSize: 16, 
        color: '#546E7A' 
    }
});
