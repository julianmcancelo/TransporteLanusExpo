import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Using View instead of SafeAreaView to avoid import errors

// Component for master dashboard control buttons
const ControlButton = ({ 
  title, 
  icon, 
  onPress, 
  color = '#E63946'
}: {
  title: string;
  icon: string;
  onPress: () => void;
  color?: string;
}) => (
  <TouchableOpacity 
    style={[styles.controlButton, { backgroundColor: color }]}
    onPress={onPress}
  >
    <MaterialCommunityIcons name={icon as any} size={28} color="#fff" />
    <Text style={styles.controlButtonText}>{title}</Text>
  </TouchableOpacity>
);

export default function MasterDashboardScreen() {
  const { userSession, signOut } = useAuth();
  const [systemStatus, setSystemStatus] = useState<{[key: string]: string}>({
    database: 'checking',
    api: 'checking',
    storage: 'checking'
  });

  // Simulate checking system status
  useEffect(() => {
    const checkStatus = async () => {
      // In a real app, these would be actual API calls
      setTimeout(() => setSystemStatus(prev => ({...prev, database: 'online'})), 1000);
      setTimeout(() => setSystemStatus(prev => ({...prev, api: 'online'})), 1500);
      setTimeout(() => setSystemStatus(prev => ({...prev, storage: 'online'})), 2000);
    };
    
    checkStatus();
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return '#4CAF50';
      case 'offline': return '#F44336';
      case 'warning': return '#FF9800';
      default: return '#999';
    }
  };

  const handleEmergencyAccess = () => {
    Alert.alert(
      'Acceso de Emergencia',
      '¿Está seguro que desea otorgar acceso de emergencia? Esta acción será registrada.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          style: 'destructive',
          onPress: () => Alert.alert('Acceso otorgado', 'Se ha concedido acceso de emergencia temporal.')
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panel de Control Master</Text>
        <Text style={styles.welcomeText}>
          Bienvenido, <Text style={styles.nameText}>{userSession?.nombre || 'Master'}</Text>
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.sectionTitle}>Estado del Sistema</Text>
        <View style={styles.statusGrid}>
          {Object.entries(systemStatus).map(([key, status]) => (
            <View key={key} style={styles.statusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]}>
                {status === 'checking' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons 
                    name={status === 'online' ? 'check' : 'alert'} 
                    size={16} 
                    color="#fff" 
                  />
                )}
              </View>
              <Text style={styles.statusLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(status) }]}>
                {status === 'checking' ? 'Verificando...' : status.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={styles.controlsContainer}>
        <Text style={styles.sectionTitle}>Controles Master</Text>
        <View style={styles.controlsGrid}>
          <ControlButton 
            title="Acceso de Emergencia" 
            icon="shield-key" 
            onPress={handleEmergencyAccess}
          />
          <ControlButton 
            title="Ver Auditoría" 
            icon="clipboard-list" 
            onPress={() => Alert.alert('Registro de Auditoría', 'Mostrando registros de acciones de usuarios en el sistema.')}
          />
          <ControlButton 
            title="Configuración del Sistema" 
            icon="tune-vertical" 
            onPress={() => Alert.alert('Configuración', 'Acceso a configuración avanzada del sistema.')}
          />
          <ControlButton 
            title="Gestión de Usuarios" 
            icon="account-cog" 
            onPress={() => Alert.alert('Usuarios', 'Administración de cuentas de usuario y permisos.')}
          />
          <ControlButton 
            title="Modo Mantenimiento" 
            icon="tools" 
            color="#FF9800"
            onPress={() => Alert.alert('Modo Mantenimiento', '¿Desea poner el sistema en modo mantenimiento?')}
          />
          <ControlButton 
            title="Cerrar Sesión" 
            icon="logout" 
            color="#666"
            onPress={() => signOut()}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#1D3557',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: '#ddd',
  },
  nameText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  statusContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statusItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlsContainer: {
    flex: 1,
    padding: 16,
  },
  controlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  controlButton: {
    width: '48%',
    backgroundColor: '#E63946',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
});
