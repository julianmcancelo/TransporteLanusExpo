import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSystemConfig, updateSystemConfig, startSystemBackup, resetDatabase, SystemConfig } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

// System configuration option component
const ConfigOption = ({ 
  title, 
  description, 
  type = 'switch',
  value,
  onValueChange
}: {
  title: string;
  description: string;
  type?: 'switch' | 'text' | 'button';
  value?: boolean | string;
  onValueChange?: (value: any) => void;
}) => {
  return (
    <View style={styles.configOption}>
      <View style={styles.configTextContainer}>
        <Text style={styles.configTitle}>{title}</Text>
        <Text style={styles.configDescription}>{description}</Text>
      </View>
      <View style={styles.configControl}>
        {type === 'switch' && (
          <Switch
            value={value as boolean}
            onValueChange={onValueChange}
            trackColor={{ false: '#ddd', true: '#A8DADC' }}
            thumbColor={value ? '#1D3557' : '#f4f3f4'}
          />
        )}
        {type === 'text' && (
          <TextInput
            style={styles.textInput}
            value={value as string}
            onChangeText={onValueChange}
          />
        )}
        {type === 'button' && (
          <TouchableOpacity 
            style={styles.buttonControl}
            onPress={() => onValueChange && onValueChange(true)}
          >
            <Text style={styles.buttonText}>Ejecutar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function SystemScreen() {
  // Get auth context for user token
  const { userSession } = useAuth();
  
  // Loading state
  const [loading, setLoading] = useState(false);
  // Save status state to track individual config saving operations
  const [, setSaveStatus] = useState<{key: string, status: 'saving' | 'success' | 'error' | null}>({key: '', status: null});
  
  // State for system configurations
  const [configs, setConfigs] = useState<SystemConfig>({
    maintenance: false,
    debugging: true,
    logLevel: 'info',
    apiTimeout: '30000',
    autoBackup: true,
    restrictedAccess: false
  });

  // Fetch configurations on component mount
  useEffect(() => {
    const fetchSystemConfig = async () => {
      if (!userSession?.token) return;
      
      setLoading(true);
      try {
        const response = await getSystemConfig(userSession.token);
        if (response.success && response.data) {
          setConfigs(response.data);
        } else {
          Alert.alert('Error', response.message || 'No se pudieron cargar las configuraciones');
        }
      } catch (error) {
        console.error('Error fetching system config:', error);
        Alert.alert('Error', 'Ocurrió un error al obtener las configuraciones');
      } finally {
        setLoading(false);
      }
    };

    fetchSystemConfig();
  }, [userSession]);

  const handleConfigChange = async (key: string, value: any) => {
    // Update local state immediately for responsive UI
    setConfigs(prev => ({ ...prev, [key]: value }));
    
    // Show saving indicator
    setSaveStatus({key: key, status: 'saving'});
    
    // Save to backend
    try {
      if (!userSession?.token) {
        throw new Error('No hay sesión de usuario');
      }
      
      const response = await updateSystemConfig(
        key as keyof SystemConfig,
        value,
        userSession.token
      );
      
      if (response.success) {
        setSaveStatus({key: key, status: 'success'});
        console.log(`Config updated: ${key} = ${value}`);
        
        // If maintenance mode is toggled, show special alert
        if (key === 'maintenance') {
          Alert.alert(
            value ? '🔧 Modo Mantenimiento Activado' : '✅ Modo Mantenimiento Desactivado',
            value 
              ? 'El sistema está ahora en modo mantenimiento. Los usuarios no podrán acceder a la plataforma.'
              : 'El sistema está ahora disponible para todos los usuarios.'
          );
        }
      } else {
        setSaveStatus({key: key, status: 'error'});
        Alert.alert('Error', response.message || `No se pudo actualizar ${key}`);
        // Revert the local state change
        setConfigs(prev => ({ ...prev, [key]: !value }));
      }
    } catch (error) {
      console.error(`Error updating config ${key}:`, error);
      setSaveStatus({key: key, status: 'error'});
      Alert.alert('Error', `No se pudo actualizar ${key}: ${error}`);
      // Revert the local state change for boolean values
      if (typeof value === 'boolean') {
        setConfigs(prev => ({ ...prev, [key]: !value }));
      }
    } finally {
      // Clear status after a delay
      setTimeout(() => {
        setSaveStatus({key: '', status: null});
      }, 2000);
    }
  };

  const handleBackupSystem = async () => {
    if (!userSession?.token) {
      Alert.alert('Error', 'No hay sesión de usuario');
      return;
    }
    
    Alert.alert(
      'Confirmar respaldo',
      '¿Estás seguro de realizar un respaldo completo del sistema?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: async () => {
            try {
              const response = await startSystemBackup(userSession.token);
              if (response.success) {
                Alert.alert(
                  '✅ Respaldo iniciado', 
                  'El respaldo del sistema se ha iniciado correctamente.'
                );
              } else {
                Alert.alert('Error', response.message || 'No se pudo iniciar el respaldo');
              }
            } catch (error) {
              console.error('Error starting backup:', error);
              Alert.alert('Error', 'Ocurrió un error al iniciar el respaldo');
            }
          } 
        }
      ]
    );
  };

  const handleResetDatabase = () => {
    if (!userSession?.token) {
      Alert.alert('Error', 'No hay sesión de usuario');
      return;
    }

    Alert.alert(
      '⚠️ ADVERTENCIA: Operación crítica',
      'Esto reiniciará la base de datos a un estado inicial. TODOS LOS DATOS SERÁN ELIMINADOS. Esta operación es irreversible.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Continuar',
          style: 'destructive', 
          onPress: () => {
            // Solicitar código de confirmación
            Alert.prompt(
              'Código de confirmación',
              'Ingrese "RESET" para confirmar el reinicio de la base de datos:',
              async (code) => {
                if (code === 'RESET') {
                  try {
                    const response = await resetDatabase(code, userSession.token);
                    if (response.success) {
                      Alert.alert(
                        'Operación programada', 
                        'El reinicio de la base de datos ha sido programado. El sistema reiniciará en breve.'
                      );
                    } else {
                      Alert.alert('Error', response.message || 'No se pudo reiniciar la base de datos');
                    }
                  } catch (error) {
                    console.error('Error resetting database:', error);
                    Alert.alert('Error', 'Ocurrió un error al reiniciar la base de datos');
                  }
                } else {
                  Alert.alert('Cancelado', 'Operación cancelada por código de confirmación incorrecto.');
                }
              },
              'plain-text',
              ''
            );
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Configuración del Sistema</Text>
        <Text style={styles.headerSubtitle}>Ajustes y configuraciones avanzadas</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1D3557" />
          <Text style={styles.loadingText}>Cargando configuraciones...</Text>
        </View>
      ) : (
        <ScrollView style={styles.configContainer}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="tune" size={20} color="#1D3557" />
          <Text style={styles.sectionTitle}>Configuración General</Text>
        </View>

        <View style={styles.configGroup}>
          <ConfigOption
            title="Modo Mantenimiento"
            description="Poner el sistema en modo mantenimiento para todos los usuarios"
            type="switch"
            value={configs.maintenance}
            onValueChange={(value) => handleConfigChange('maintenance', value)}
          />
          
          <ConfigOption
            title="Modo Depuración"
            description="Habilitar registros detallados y herramientas de depuración"
            type="switch"
            value={configs.debugging}
            onValueChange={(value) => handleConfigChange('debugging', value)}
          />
          
          <ConfigOption
            title="Nivel de Log"
            description="Nivel de detalle para los registros del sistema"
            type="text"
            value={configs.logLevel}
            onValueChange={(value) => handleConfigChange('logLevel', value)}
          />

          <ConfigOption
            title="Timeout de API (ms)"
            description="Tiempo máximo de espera para llamadas API"
            type="text"
            value={configs.apiTimeout}
            onValueChange={(value) => handleConfigChange('apiTimeout', value)}
          />
        </View>

        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="security" size={20} color="#1D3557" />
          <Text style={styles.sectionTitle}>Seguridad y Respaldos</Text>
        </View>

        <View style={styles.configGroup}>
          <ConfigOption
            title="Backup Automático"
            description="Realizar backup del sistema cada 24 horas"
            type="switch"
            value={configs.autoBackup}
            onValueChange={(value) => handleConfigChange('autoBackup', value)}
          />
          
          <ConfigOption
            title="Restricción de Acceso"
            description="Limitar acceso a IPs autorizadas solamente"
            type="switch"
            value={configs.restrictedAccess}
            onValueChange={(value) => handleConfigChange('restrictedAccess', value)}
          />
          
          <ConfigOption
            title="Backup Manual"
            description="Iniciar un backup completo del sistema ahora"
            type="button"
            onValueChange={handleBackupSystem}
          />
        </View>

        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="database" size={20} color="#E63946" />
          <Text style={[styles.sectionTitle, { color: '#E63946' }]}>Operaciones Críticas</Text>
        </View>

        <View style={styles.configGroup}>
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleResetDatabase}
          >
            <MaterialCommunityIcons name="database-remove" size={24} color="#fff" />
            <Text style={styles.dangerButtonText}>Reiniciar Base de Datos</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      )}
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
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#A8DADC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1D3557',
  },
  configContainer: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D3557',
    marginLeft: 8,
  },
  configGroup: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  configOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  configTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  configTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  configDescription: {
    fontSize: 13,
    color: '#666',
  },
  configControl: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    minWidth: 100,
    textAlign: 'right',
  },
  buttonControl: {
    backgroundColor: '#1D3557',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  dangerButton: {
    backgroundColor: '#E63946',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  }
});
