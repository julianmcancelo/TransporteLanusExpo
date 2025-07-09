// =========================================================================
// ARCHIVO: app/(admin)/dashboard.tsx (v2.0 - Con Turnos Funcionales desde API)
// =========================================================================
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Circle, Path, Svg } from 'react-native-svg';

import { API_TRAMITES_URL } from '../../src/constants/api'; // Se importa la URL de la API
import { Colors } from '../../src/constants/Colors';
import { useAuth } from '../../src/contexts/AuthContext';

// --- Tipos de Datos (ajustados a la respuesta de la API) ---
interface Habilitacion {
  id: string;
  nro_licencia: string;
  tipo_transporte: string;
}
interface Titular { nombre: string; }
interface Vehiculo { dominio: string; }
interface Turno { fecha: string; hora: string; estado: string; }
interface Tramite {
  habilitacion: Habilitacion;
  titular: Titular | null;
  vehiculo: Vehiculo | null;
  turno: Turno | null;
}
type IconProps = { color: string; size?: number };

// --- Iconos ---
const CalendarPlusIcon = ({ color, size = 32 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M8 2v3m8-3v3M3 8h18M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Path d="M12 15v-3m-1.5 1.5h3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const FilePlusIcon = ({ color, size = 32 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Path d="M14 2v6h6M12 18v-6M9 15h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const UserPlusIcon = ({ color, size = 32 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Path d="M23 18v-2m-2-2h-2m2 2h2m-2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const CarIcon = ({ color, size = 32 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M14 16.67H9.33a1 1 0 01-1-1V12.33a1 1 0 011-1H14a1 1 0 011 1v3.34a1 1 0 01-1 1z" stroke={color} strokeWidth="2" /><Path d="M10.33 11.33V8.83a2 2 0 012-2h0a2 2 0 012 2v2.5M17.5 16.67h1a1 1 0 001-1V10.83a3 3 0 00-3-3H7.5a3 3 0 00-3 3v4.84a1 1 0 001 1h1m9 0v2m-9-2v2" stroke={color} strokeWidth="2" /></Svg>;
const SearchIcon = ({ color, size = 32 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const ChartIcon = ({ color, size = 32 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M18 20V10m-6 10V4M6 20v-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;

// --- Componentes de UI Animados ---

const AnimatedCard = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    useEffect(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
        translateY.value = withDelay(delay, withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

const ActionCard = ({ title, subtitle, icon, onPress }: { title: string, subtitle: string, icon: React.ReactNode, onPress: () => void }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
        <View style={styles.actionIconContainer}>{icon}</View>
        <View>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
    </TouchableOpacity>
);

const AppointmentCard = ({ tramite }: { tramite: Tramite }) => (
    <View style={styles.appointmentCard}>
        <View style={styles.appointmentTime}>
            <Text style={styles.appointmentHour}>{tramite.turno?.hora.substring(0, 5) || 'N/A'}</Text>
            <Text style={styles.appointmentDate}>{tramite.turno?.fecha ? new Date(tramite.turno.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) : 'N/A'}</Text>
        </View>
        <View style={styles.appointmentDetails}>
            <Text style={styles.appointmentType}>{tramite.habilitacion.tipo_transporte}</Text>
            <Text style={styles.appointmentName}>{tramite.titular?.nombre || 'Sin titular'}</Text>
            <Text style={styles.appointmentDomain}>{tramite.vehiculo?.dominio || 'Sin dominio'}</Text>
        </View>
    </View>
);


// --- Pantalla Principal del Dashboard ---
export default function AdminDashboard() {
  const { userSession, logout } = useAuth();
  const router = useRouter();
  const [tramites, setTramites] = useState<Tramite[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await fetch(API_TRAMITES_URL);
        const result = await response.json();
        if (result.status === 'success') {
            setTramites(result.data || []);
        } else {
            throw new Error(result.message || "No se pudieron cargar los datos.");
        }
    } catch (e: any) {
        setError(e.message);
        console.error("Error fetching dashboard data", e);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading && !tramites) {
    return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={{ marginTop: 10, color: Colors.light.grayMedium }}>Cargando datos...</Text>
        </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Panel de Administrador" }} />
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchData} />}
        >
            <View style={styles.header}>
                <View>
                    <Text style={styles.subtitle}>Bienvenido, {userSession?.nombre || 'Admin'}.</Text>
                    <Text style={styles.title}>Panel de Gestión</Text>
                </View>
                <TouchableOpacity onPress={logout}>
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>
            
            <AnimatedCard delay={100}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Acciones Principales</Text>
                    <View style={styles.actionsGrid}>
                        <ActionCard title="Gestionar Turnos" subtitle="Ver y editar agenda" icon={<CalendarPlusIcon color={Colors.light.primary} />} onPress={() => {}} />
                        <ActionCard title="Nueva Habilitación" subtitle="Iniciar trámite" icon={<FilePlusIcon color={Colors.light.primary} />} onPress={() => {}} />
                        <ActionCard title="Registrar Persona" subtitle="Cargar nuevo titular" icon={<UserPlusIcon color={Colors.light.primary} />} onPress={() => {}} />
                        <ActionCard title="Registrar Vehículo" subtitle="Añadir nueva unidad" icon={<CarIcon color={Colors.light.primary} />} onPress={() => {}} />
                        <ActionCard title="Buscar" subtitle="Habilitaciones y más" icon={<SearchIcon color={Colors.light.primary} />} onPress={() => {}} />
                        <ActionCard title="Reportes" subtitle="Ver estadísticas" icon={<ChartIcon color={Colors.light.primary} />} onPress={() => {}} />
                    </View>
                </View>
            </AnimatedCard>

            <AnimatedCard delay={200}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Próximos Turnos del Día</Text>
                    {isLoading ? (
                        <ActivityIndicator color={Colors.light.primary} />
                    ) : error ? (
                        <Text style={{color: Colors.light.error}}>{error}</Text>
                    ) : tramites && tramites.length > 0 ? (
                        tramites.map(tramite => <AppointmentCard key={tramite.habilitacion.id} tramite={tramite} />)
                    ) : (
                        <Text style={{color: Colors.light.grayMedium}}>No hay turnos programados para hoy.</Text>
                    )}
                </View>
            </AnimatedCard>
            
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.light.grayMedium,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: `${Colors.light.primary}10`,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  actionIconContainer: {
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  actionSubtitle: {
    fontSize: 13,
    color: Colors.light.grayMedium,
    marginTop: 2,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  appointmentTime: {
    alignItems: 'center',
    marginRight: 20,
    width: 60,
  },
  appointmentHour: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  appointmentDate: {
    fontSize: 12,
    color: Colors.light.grayMedium,
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  appointmentName: {
    fontSize: 14,
    color: Colors.light.grayMedium,
  },
  appointmentDomain: {
    fontSize: 14,
    color: Colors.light.grayMedium,
    fontStyle: 'italic',
  },
});
