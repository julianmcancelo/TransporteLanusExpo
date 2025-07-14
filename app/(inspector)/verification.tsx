// =========================================================================
// ARCHIVO: app/(inspector)/verificacion.tsx (Versión Completa y Funcional)
// Recibe y muestra todos los datos del trámite y navega al formulario.
// =========================================================================
import { Colors } from '@/constants/Colors'; // Asumiendo que los colores están en este archivo
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

// --- Tipos de Datos Completos ---
// Se expanden las interfaces para incluir todos los campos posibles del objeto 'tramite'
interface Habilitacion {
  id: string;
  nro_licencia: string;
  estado: string;
  tipo_transporte: string;
  expte: string;
}
interface Titular {
  nombre: string;
  dni: string;
}
interface Vehiculo {
  dominio: string;
  marca: string;
  modelo: string;
}
interface Turno {
  fecha: string;
  hora: string;
  estado: string;
}
interface Tramite {
  habilitacion: Habilitacion;
  titular: Titular | null;
  vehiculo: Vehiculo | null;
  turno: Turno | null;
}

// --- Iconos ---
const UserIcon = ({ color }: { color: string }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" /><Path d="M12 11a4 4 0 100-8 4 4 0 000 8z" stroke={color} strokeWidth="2" /></Svg>;
const CarIcon = ({ color }: { color: string }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M14 16.67H9.33a1 1 0 01-1-1V12.33a1 1 0 011-1H14a1 1 0 011 1v3.34a1 1 0 01-1 1z" stroke={color} strokeWidth="2" /><Path d="M10.33 11.33V8.83a2 2 0 012-2h0a2 2 0 012 2v2.5M17.5 16.67h1a1 1 0 001-1V10.83a3 3 0 00-3-3H7.5a3 3 0 00-3 3v4.84a1 1 0 001 1h1m9 0v2m-9-2v2" stroke={color} strokeWidth="2" /></Svg>;
const CalendarIcon = ({ color }: { color: string }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M8 2v3M16 2v3M3 8h18M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke={color} strokeWidth="2" /></Svg>;
const FileIcon = ({ color }: { color: string }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7z" stroke={color} strokeWidth="2" /><Path d="M13 2v7h7" stroke={color} strokeWidth="2" /></Svg>;


// --- Componente de Fila de Información ---
const InfoRow = ({ label, value, icon }: { label: string, value: string | undefined | null, icon: React.ReactNode }) => {
    if (!value) return null;
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIcon}>{icon}</View>
            <View>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
            </View>
        </View>
    );
};

const VerificationScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const tramite: Tramite | null = params.tramite ? JSON.parse(params.tramite as string) : null;
    const themeColors = Colors['light']; // Asumiendo un tema claro por defecto

    if (!tramite) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Error: No se recibieron los datos del trámite.</Text>
                <Button title="Volver" onPress={() => router.back()} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: `Verificación: ${tramite.habilitacion.nro_licencia}` }} />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Detalles del Trámite</Text>
                
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Titular</Text>
                    <InfoRow label="Nombre Completo" value={tramite.titular?.nombre} icon={<UserIcon color={themeColors.primary} />} />
                    <InfoRow label="DNI" value={tramite.titular?.dni} icon={<FileIcon color={themeColors.primary} />} />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Vehículo</Text>
                    <InfoRow label="Dominio" value={tramite.vehiculo?.dominio} icon={<CarIcon color={themeColors.primary} />} />
                    <InfoRow label="Marca y Modelo" value={`${tramite.vehiculo?.marca || ''} ${tramite.vehiculo?.modelo || ''}`.trim()} icon={<CarIcon color={themeColors.primary} />} />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Habilitación</Text>
                    <InfoRow label="N° de Licencia" value={tramite.habilitacion.nro_licencia} icon={<FileIcon color={themeColors.primary} />} />
                    <InfoRow label="Tipo de Transporte" value={tramite.habilitacion.tipo_transporte} icon={<CarIcon color={themeColors.primary} />} />
                    <InfoRow label="Expediente" value={tramite.habilitacion.expte} icon={<FileIcon color={themeColors.primary} />} />
                </View>

                {tramite.turno && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Turno Asignado</Text>
                        <InfoRow label="Fecha" value={new Date(tramite.turno.fecha + 'T00:00:00').toLocaleDateString('es-AR')} icon={<CalendarIcon color={themeColors.primary} />} />
                        <InfoRow label="Hora" value={`${tramite.turno.hora.substring(0, 5)} hs`} icon={<CalendarIcon color={themeColors.primary} />} />
                    </View>
                )}

                {/* ======================= CAMBIO REALIZADO AQUÍ ======================= */}
                <TouchableOpacity 
                    style={styles.button} 
                    onPress={() => {
                        // Navega a la pantalla del formulario de inspección
                        // Pasa el objeto 'tramite' como un string JSON en los parámetros
                        router.push({
                            pathname: '/inspection-form',
                            params: { tramite: JSON.stringify(tramite) },
                        });
                    }}
                >
                    <Text style={styles.buttonText}>Comenzar Inspección</Text>
                </TouchableOpacity>
                {/* ======================= FIN DEL CAMBIO ======================= */}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6F8', // BACKGROUND_COLOR
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#263238', // TEXT_DARK_COLOR
    },
    card: {
        backgroundColor: '#FFFFFF', // CARD_BACKGROUND_COLOR
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0D47A1', // PRIMARY_COLOR
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ECEFF1', // GRAY_LIGHT_COLOR
        paddingBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    infoIcon: {
        marginRight: 15,
    },
    label: {
        fontSize: 14,
        color: '#546E7A', // GRAY_MEDIUM_COLOR
        marginBottom: 2,
    },
    value: {
        fontSize: 18,
        fontWeight: '500',
        color: '#263238', // TEXT_DARK_COLOR
    },
    button: {
        marginTop: 10,
        backgroundColor: '#0093D2', // Un azul más brillante para la acción
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default VerificationScreen;