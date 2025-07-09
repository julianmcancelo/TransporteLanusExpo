// app/(contribuyente)/appointments.tsx

/// <reference types="expo-router/types" />

import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// CORRECCIÓN: Se usan los alias correctos y limpios para las importaciones.
import { API_APPOINTMENTS_URL, API_CONFIRM_APPOINTMENT_URL } from '@/constants/api';
import { Colors } from '@/constants/Colors';
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
  themeColors: typeof Colors.light;
};


// --- Iconos ---
const CalendarIcon = ({ color }: IconProps) => <Svg width={40} height={40} viewBox="0 0 24 24" fill="none"><Path d="M8 2v3M16 2v3M3 8h18M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const BackIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>;


// --- Componente para cada tarjeta de turno ---
const AppointmentCard = ({ appointment, onConfirm, themeColors }: AppointmentCardProps) => {
    const styles = getStyles(themeColors);

    const getStatusStyle = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMADO': return { badge: styles.badgeSuccess, text: styles.textSuccess };
            case 'PENDIENTE': return { badge: styles.badgeWarning, text: styles.textWarning };
            case 'CANCELADO':
            case 'ANULADO': return { badge: styles.badgeError, text: styles.textError };
            default: return { badge: styles.badgeGray, text: styles.textGray };
        }
    };

    const statusStyle = getStatusStyle(appointment.estado);
    const date = new Date(`${appointment.fecha}T${appointment.hora}`);
    
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <CalendarIcon color={themeColors.primary} />
                <View style={styles.headerTextContainer}>
                    <Text style={styles.dateText}>{date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                    <Text style={styles.timeText}>{date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</Text>
                </View>
            </View>
            <View style={styles.separator} />
            <View style={styles.cardBody}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Licencia N°:</Text>
                    <Text style={styles.detailValue}>{appointment.nro_licencia}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transporte:</Text>
                    <Text style={styles.detailValue}>{appointment.tipo_transporte}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Estado:</Text>
                    <View style={[styles.statusBadge, statusStyle.badge]}>
                        <Text style={[styles.statusText, statusStyle.text]}>{appointment.estado}</Text>
                    </View>
                </View>
                {appointment.observaciones &&
                    <View style={styles.detailRowColumn}>
                        <Text style={styles.detailLabel}>Observaciones:</Text>
                        <Text style={styles.observationText}>{appointment.observaciones}</Text>
                    </View>
                }
            </View>
            {appointment.estado?.toUpperCase() === 'PENDIENTE' && (
                <TouchableOpacity style={styles.confirmButton} onPress={() => onConfirm(appointment.id)}>
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
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const styles = getStyles(themeColors);

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
            return <ActivityIndicator size="large" color={themeColors.primary} style={styles.centered} />;
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
                renderItem={({ item }) => <AppointmentCard appointment={item} onConfirm={handleConfirmAppointment} themeColors={themeColors} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* El título ahora se maneja en el _layout.tsx, por lo que se elimina la cabecera de aquí */}
            {renderContent()}
        </SafeAreaView>
    );
};

// --- Estilos Dinámicos ---
const getStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20 },
    card: { backgroundColor: colors.cardBackground, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 4, overflow: 'hidden', borderWidth: 1, borderColor: `${colors.icon}20` },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, },
    headerTextContainer: { marginLeft: 15 },
    dateText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    timeText: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
    separator: { height: 1, backgroundColor: `${colors.icon}20` },
    cardBody: { padding: 20 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    detailRowColumn: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 12 },
    detailLabel: { fontSize: 14, color: colors.grayMedium },
    detailValue: { fontSize: 16, fontWeight: '500', color: colors.text },
    observationText: { fontSize: 14, color: colors.text, marginTop: 4, fontStyle: 'italic' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 },
    statusText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
    badgeSuccess: { backgroundColor: `${colors.success}20` },
    textSuccess: { color: colors.success },
    badgeWarning: { backgroundColor: `${colors.warning}20` },
    textWarning: { color: colors.warning },
    badgeError: { backgroundColor: `${colors.error}20` },
    textError: { color: colors.error },
    badgeGray: { backgroundColor: `${colors.grayMedium}20` },
    textGray: { color: colors.grayMedium },
    confirmButton: { backgroundColor: colors.primary, paddingVertical: 15, alignItems: 'center' },
    confirmButtonText: { color: colors.textLight, fontSize: 16, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: colors.grayMedium }
});
