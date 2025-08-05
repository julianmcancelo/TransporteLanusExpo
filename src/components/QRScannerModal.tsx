import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View
} from 'react-native';

// Interfaces para nuestros componentes
interface InfoRowProps {
  label: string;
  value: string | number | null;
  valueStyle?: StyleProp<TextStyle>;
}

interface CredentialData {
  vigencia_fin: string;
  vigencia_inicio: string;
  estado: string;
  nro_licencia: string;
  resolucion: string;
  titular_foto: string | null;
  titular_nombre: string;
  titular_dni: string;
  conductor_foto: string | null;
  conductor_nombre: string;
  licencia_categoria: string;
  celador_nombre?: string;
  celador_dni?: string;
  dominio: string;
  marca: string;
  modelo: string;
  ano: string | number | null;
  asientos: string | number | null;
  chasis: string | null;
  Vencimiento_VTV: string | null;
  Vencimiento_Poliza: string | null;
}

interface CredentialDisplayProps {
  data: CredentialData;
  onClose: () => void;
}

// --- Componente Auxiliar para mostrar la información ---
const InfoRow = ({ label, value, valueStyle }: InfoRowProps) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueStyle]}>{value || 'N/A'}</Text>
  </View>
);

// --- Componente para mostrar los datos de la credencial ---
const CredentialDisplay = ({ data, onClose }: CredentialDisplayProps) => {
  const defaultUserImage = 'https://via.placeholder.com/100/ced4da/868e96?text=Sin+Foto';
  
  const isEnTramite = data.estado === 'EN TRAMITE';
  const isExpired = new Date(data.vigencia_fin) < new Date();

  const getStatusStyles = () => {
    switch (data.estado) {
      case 'HABILITADO':
        return { container: { backgroundColor: '#D1FAE5' }, text: { color: '#065F46' } }; // Verde
      case 'EN TRAMITE':
        return { container: { backgroundColor: '#FEF3C7' }, text: { color: '#92400E' } }; // Ámbar
      default:
        return { container: { backgroundColor: '#FEE2E2' }, text: { color: '#B91C1C' } }; // Rojo
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr || dateStr.split('-').length < 3) return 'N/A';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const statusStyle = getStatusStyles();

  return (
    <SafeAreaView style={styles.displayContainer}>
       <View style={styles.modalHeader}>
         <Text style={styles.modalTitle}>Credencial Validada</Text>
         <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
         </TouchableOpacity>
       </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isExpired && (
          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>VENCIDA</Text>
          </View>
        )}
        {isEnTramite && !isExpired && (
          <View style={[styles.statusBanner, {backgroundColor: '#D97706'}]}>
            <Text style={styles.statusBannerText}>EN TRÁMITE</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información de la Habilitación</Text>
          <InfoRow label="N° de Licencia" value={data.nro_licencia} valueStyle={{ color: '#0288D1', fontSize: 18, fontWeight: 'bold' }} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado</Text>
            <View style={[styles.statusBadge, statusStyle.container]}>
              <Text style={[styles.statusBadgeText, statusStyle.text]}>{data.estado}</Text>
            </View>
          </View>
          <InfoRow label="Vigencia" value={`${formatDate(data.vigencia_inicio)} al ${formatDate(data.vigencia_fin)}`} />
          <InfoRow label="Resolución" value={data.resolucion} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personas Involucradas</Text>
          <View style={styles.personRow}>
            <Image source={{ uri: data.titular_foto || defaultUserImage }} style={styles.avatar} />
            <View style={styles.personInfo}>
              <Text style={styles.personRole}>Titular del Permiso</Text>
              <Text style={styles.personName}>{data.titular_nombre}</Text>
              <Text style={styles.personDetail}>DNI: {data.titular_dni}</Text>
            </View>
          </View>
          <View style={styles.personRow}>
            <Image source={{ uri: data.conductor_foto || defaultUserImage }} style={styles.avatar} />
            <View style={styles.personInfo}>
              <Text style={styles.personRole}>Conductor/a</Text>
              <Text style={styles.personName}>{data.conductor_nombre}</Text>
              <Text style={styles.personDetail}>Lic. Cat: {data.licencia_categoria}</Text>
            </View>
          </View>
           {data.celador_nombre && (
            <View style={styles.personRow}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={{fontSize: 30}}>👤</Text>
                </View>
                <View style={styles.personInfo}>
                <Text style={styles.personRole}>Celador/a</Text>
                <Text style={styles.personName}>{data.celador_nombre}</Text>
                <Text style={styles.personDetail}>DNI: {data.celador_dni ?? 'N/A'}</Text>
                </View>
            </View>
           )}
        </View>

        <View style={styles.card}>
            <Text style={styles.cardTitle}>Vehículo Habilitado</Text>
            <View style={styles.dominioContainer}>
                <Text style={styles.dominioText}>{data.dominio}</Text>
            </View>
            <InfoRow label="Marca / Modelo" value={`${data.marca} ${data.modelo} (${data.ano || 'N/A'})`} />
            <InfoRow label="Asientos" value={data.asientos} />
            <InfoRow label="Chasis" value={data.chasis} valueStyle={{fontFamily: 'monospace'}}/>
            <InfoRow label="Vencimiento VTV" value={formatDate(data.Vencimiento_VTV)} />
            <InfoRow label="Vencimiento Póliza" value={formatDate(data.Vencimiento_Poliza)} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};


// --- Componente Modal de Escaneo QR ---
interface QRScannerModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function QRScannerModal({ isVisible, onClose }: QRScannerModalProps) {
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [credentialData, setCredentialData] = useState<CredentialData | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const resetScanner = () => {
    setCredentialData(null);
    setScanned(false);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (isLoading) return;

    setIsLoading(true);
    setScanned(true);

    let qrToken = '';
    if (data.includes('token=')) {
      qrToken = data.split('token=')[1].split('&')[0];
    } else {
      qrToken = data;
    }
    
    if (!qrToken) {
      setIsLoading(false);
      Alert.alert('QR Inválido', 'No se pudo extraer un token del código QR.', [{ text: 'Intentar de Nuevo', onPress: resetScanner }]);
      return;
    }

    try {
      const apiUrl = `https://credenciales.transportelanus.com.ar/publico/api/CredentialData.php?token=${encodeURIComponent(qrToken)}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`El servidor respondió con un error (Código: ${response.status})`);
      }
      
      const jsonData = await response.json();

      if (jsonData.error) {
        Alert.alert('Error de Validación', jsonData.message || 'La API devolvió un error.', [{ text: 'Intentar de Nuevo', onPress: resetScanner }]);
      } else {
        setCredentialData(jsonData);
      }
    } catch (error) {
      console.error('Error al procesar la respuesta:', error);
      let errorMessage = 'No se pudo comunicar con el servidor.';
      if (error instanceof Error) {
        if (error.message.includes('JSON Parse error')) {
            errorMessage = 'El servidor no devolvió una respuesta en el formato JSON esperado.';
        } else {
            errorMessage = error.message;
        }
      }
      Alert.alert('Error de Conexión', errorMessage, [{ text: 'Intentar de Nuevo', onPress: resetScanner }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Validar Credencial QR' }} />
        <Text style={styles.permissionText}>Solicitando permiso para usar la cámara...</Text>
      </View>
    );
  }
  
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Validar Credencial QR' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.permissionText}>No hay acceso a la cámara. Habilite los permisos en la configuración.</Text>
          <TouchableOpacity style={styles.scanButton} onPress={requestPermission}>
            <Text style={styles.scanButtonText}>Solicitar Permisos</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If not visible, don't render anything
  if (!isVisible) {
    return null;
  }

  // Reset scanner when closed
  const handleClose = () => {
    resetScanner();
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Validar Credencial QR' }} />
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Text style={styles.backButtonText}>✕ Cerrar</Text>
          </TouchableOpacity>
        </View>

        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          style={StyleSheet.absoluteFillObject}
        >
          <View style={styles.layerTop} />
          <View style={styles.layerCenter}>
            <View style={styles.layerLeft} />
            <View style={styles.focused} />
            <View style={styles.layerRight} />
          </View>
          <View style={styles.layerBottom}>
              <Text style={styles.scanText}>Apunte al código QR</Text>
          </View>
          
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Validando...</Text>
            </View>
          )}
        </CameraView>

        <Modal
          visible={credentialData !== null}
          animationType="slide"
          onRequestClose={resetScanner}
        >
          {credentialData && <CredentialDisplay data={credentialData} onClose={resetScanner} />}
        </Modal>
      </View>
    </Modal>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  headerContainer: { paddingTop: 40, paddingHorizontal: 16, paddingBottom: 8, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10 },
  backButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, alignSelf: 'flex-start' },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  permissionText: { textAlign: 'center', fontSize: 16, padding: 20, color: 'white' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scanButton: { backgroundColor: '#0288D1', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, marginTop: 20 },
  scanButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  layerTop: { flex: 2, backgroundColor: 'rgba(0,0,0,0.6)' },
  layerCenter: { flex: 3, flexDirection: 'row' },
  layerLeft: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  focused: { flex: 10, borderWidth: 2, borderColor: '#fff', borderRadius: 10 },
  layerRight: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  layerBottom: { flex: 2, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  scanText: { color: '#fff', fontSize: 18, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 4 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: 10, fontSize: 16 },
  
  // Estilos del Modal y Credencial
  displayContainer: { flex: 1, backgroundColor: '#F1F5F9' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0288D1',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  scrollContent: { padding: 16, paddingBottom: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6 },
  infoLabel: { fontSize: 15, color: '#64748B', fontWeight: '500', marginRight: 8 },
  infoValue: { fontSize: 15, color: '#1E293B', fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 99 },
  statusBadgeText: { fontWeight: 'bold', fontSize: 14 },
  personRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#f8f9fa' },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  personInfo: { marginLeft: 12, flex: 1 },
  personRole: { fontSize: 16, fontWeight: 'bold', color: '#0288D1' },
  personName: { fontSize: 15, color: '#334155' },
  personDetail: { fontSize: 13, color: '#64748B' },
  dominioContainer: { backgroundColor: '#1E293B', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, alignSelf: 'flex-start', marginVertical: 8 },
  dominioText: { color: 'white', fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace' },
  statusBanner: { backgroundColor: '#DC2626', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  statusBannerText: { color: 'white', fontSize: 22, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },
});
