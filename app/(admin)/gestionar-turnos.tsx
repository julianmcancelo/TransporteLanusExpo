// =========================================================================
// ARCHIVO: app/(admin)/gestionar-turnos.tsx (v3.0 - Funcional con API Real)
// Permite visualizar y gestionar la agenda de turnos.
// =========================================================================
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { API_CREAR_TURNO_URL, API_GET_TURNOS_POR_FECHA_URL } from '../../src/constants/api';
import { Colors } from '../../src/constants/Colors';

// --- Tipos de Datos ---
interface Habilitacion { id: string; nro_licencia: string; tipo_transporte: string; }
interface Titular { nombre: string; }
interface Vehiculo { dominio: string; }
interface Turno { id: string; fecha: string; hora: string; estado: 'CONFIRMADO' | 'PENDIENTE' | 'CANCELADO'; }
interface Tramite { habilitacion: Habilitacion; titular: Titular | null; vehiculo: Vehiculo | null; turno: Turno | null; }
type IconProps = { color: string; size?: number };

// --- Iconos ---
const PlusIcon = ({ color, size = 24 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 5v14m-7-7h14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const ChevronLeftIcon = ({ color, size = 24 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const CloseIcon = ({ color, size = 24 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;

// --- Componentes de UI ---

const DatePill = ({ date, isSelected, onPress }: { date: Date, isSelected: boolean, onPress: () => void }) => {
    const dayName = date.toLocaleDateString('es-AR', { weekday: 'short' }).substring(0, 3).toUpperCase();
    const dayNumber = date.getDate();
    const themeColors = Colors.light;

    return (
        <TouchableOpacity onPress={onPress} style={[styles.datePill, isSelected && { backgroundColor: themeColors.primary }]}>
            <Text style={[styles.datePillDayName, isSelected && { color: themeColors.textLight }]}>{dayName}</Text>
            <Text style={[styles.datePillDayNumber, isSelected && { color: themeColors.textLight }]}>{dayNumber}</Text>
        </TouchableOpacity>
    );
};

const AppointmentRow = ({ tramite }: { tramite: Tramite }) => {
    const getStatusStyle = () => {
        switch (tramite.turno?.estado) {
            case 'CONFIRMADO': return { backgroundColor: `${Colors.light.success}20`, color: Colors.light.success };
            case 'PENDIENTE': return { backgroundColor: `${Colors.light.warning}20`, color: Colors.light.warning };
            case 'CANCELADO': return { backgroundColor: `${Colors.light.error}20`, color: Colors.light.error };
            default: return { backgroundColor: `${Colors.light.grayMedium}20`, color: Colors.light.grayMedium };
        }
    };
    const statusStyle = getStatusStyle();

    return (
        <View style={styles.appointmentCard}>
            <View style={styles.appointmentTimeContainer}>
                <Text style={styles.appointmentHour}>{tramite.turno?.hora.substring(0, 5) || 'N/A'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>{tramite.turno?.estado}</Text>
                </View>
            </View>
            <View style={styles.appointmentDetails}>
                <Text style={styles.appointmentType}>{tramite.habilitacion.tipo_transporte}</Text>
                <Text style={styles.appointmentName}>{tramite.titular?.nombre || 'Sin titular'}</Text>
                <Text style={styles.appointmentDomain}>{tramite.vehiculo?.dominio || 'Sin dominio'}</Text>
                <View style={styles.appointmentActions}>
                    <TouchableOpacity style={styles.actionButton}><Text style={styles.actionButtonText}>Editar</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}><Text style={[styles.actionButtonText, {color: Colors.light.error}]}>Cancelar</Text></TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

// --- Pantalla Principal ---
export default function ManageAppointmentsScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [turnos, setTurnos] = useState<Tramite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const dates = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date;
  });

  const fetchTurnos = useCallback(async (date: Date) => {
    setIsLoading(true);
    const formattedDate = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    try {
        const response = await fetch(`${API_GET_TURNOS_POR_FECHA_URL}?fecha=${formattedDate}`);
        const result = await response.json();
        if (result.status === 'success') {
            setTurnos(result.data || []);
        } else {
            throw new Error(result.message);
        }
    } catch (e: any) {
        console.error("Error fetching appointments", e);
        Alert.alert("Error", `No se pudieron cargar los turnos: ${e.message}`);
        setTurnos([]); // Limpiar turnos en caso de error
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTurnos(selectedDate);
  }, [selectedDate, fetchTurnos]);

  const handleCreateTurno = async (newTurno: { habilitacion_id: string, fecha: string, hora: string, observaciones: string }) => {
      try {
          const response = await fetch(API_CREAR_TURNO_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newTurno)
          });
          const result = await response.json();
          if (result.status !== 'success') {
              throw new Error(result.message || 'No se pudo crear el turno.');
          }
          Alert.alert('Éxito', 'Turno creado correctamente.');
          setIsModalVisible(false);
          fetchTurnos(selectedDate); // Recargar la lista para la fecha actual
      } catch (error: any) {
          Alert.alert('Error', error.message);
      }
  };

  return (
    <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Gestionar Turnos" }} />
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><ChevronLeftIcon color={Colors.light.text} size={28} /></TouchableOpacity>
            <Text style={styles.title}>Agenda de Turnos</Text>
            <View style={{width: 40}} />
        </View>

        <View style={styles.dateSelectorContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {dates.map(date => <DatePill key={date.toISOString()} date={date} isSelected={date.toDateString() === selectedDate.toDateString()} onPress={() => setSelectedDate(date)} />)}
            </ScrollView>
        </View>

        {isLoading ? (
            <ActivityIndicator style={{marginTop: 50}} size="large" color={Colors.light.primary} />
        ) : (
            <FlatList
                data={turnos}
                keyExtractor={(item) => item.turno?.id || item.habilitacion.id}
                renderItem={({ item }) => <AppointmentRow tramite={item} />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No hay turnos para esta fecha.</Text></View>}
            />
        )}
        
        <TouchableOpacity style={styles.fab} onPress={() => setIsModalVisible(true)}>
            <PlusIcon color="#FFF" />
        </TouchableOpacity>

        <CreateAppointmentModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} onCreate={handleCreateTurno} />
    </SafeAreaView>
  );
}

// --- Modal para Crear Turno ---
const CreateAppointmentModal = ({ visible, onClose, onCreate }: { visible: boolean, onClose: () => void, onCreate: (data: any) => void }) => {
    const [habilitacionId, setHabilitacionId] = useState('');
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [observaciones, setObservaciones] = useState('');

    const handleConfirm = () => {
        if (!habilitacionId || !fecha || !hora) {
            Alert.alert('Campos Incompletos', 'Por favor, complete todos los campos requeridos.');
            return;
        }
        onCreate({ habilitacion_id: habilitacionId, fecha, hora, observaciones });
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Crear Nuevo Turno</Text>
                        <TouchableOpacity onPress={onClose}><CloseIcon color={Colors.light.grayMedium} /></TouchableOpacity>
                    </View>
                    <TextInput style={styles.input} placeholder="ID de Habilitación" value={habilitacionId} onChangeText={setHabilitacionId} keyboardType="numeric" />
                    <TextInput style={styles.input} placeholder="Fecha (AAAA-MM-DD)" value={fecha} onChangeText={setFecha} />
                    <TextInput style={styles.input} placeholder="Hora (HH:MM)" value={hora} onChangeText={setHora} />
                    <TextInput style={[styles.input, {height: 80}]} placeholder="Observaciones (opcional)" value={observaciones} onChangeText={setObservaciones} multiline />
                    <TouchableOpacity style={styles.mainButton} onPress={handleConfirm}>
                        <Text style={styles.mainButtonText}>Confirmar Turno</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.light.text },
  backButton: { padding: 10 },
  dateSelectorContainer: { paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  datePill: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, marginRight: 10, backgroundColor: Colors.light.cardBackground, alignItems: 'center' },
  datePillDayName: { fontSize: 12, color: Colors.light.grayMedium },
  datePillDayNumber: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  listContent: { padding: 20 },
  appointmentCard: { flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 15, backgroundColor: Colors.light.cardBackground, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  appointmentTimeContainer: { alignItems: 'center', marginRight: 15, width: 65 },
  appointmentHour: { fontSize: 18, fontWeight: 'bold', color: Colors.light.primary },
  appointmentDetails: { flex: 1 },
  appointmentType: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text },
  appointmentName: { fontSize: 14, color: Colors.light.grayMedium },
  appointmentDomain: { fontSize: 14, color: Colors.light.grayMedium, fontStyle: 'italic' },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 15 },
  statusBadgeText: { fontSize: 12, fontWeight: 'bold' },
  appointmentActions: { flexDirection: 'row', marginTop: 10 },
  actionButton: { marginRight: 15 },
  actionButtonText: { color: Colors.light.primary, fontWeight: '500' },
  emptyContainer: { marginTop: 50, alignItems: 'center' },
  emptyText: { fontSize: 16, color: Colors.light.grayMedium },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 4 } },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: Colors.light.background, borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.light.text },
  input: { height: 50, backgroundColor: Colors.light.grayLight, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: Colors.light.border },
  mainButton: { backgroundColor: Colors.light.primary, padding: 15, borderRadius: 8, alignItems: 'center' },
  mainButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
