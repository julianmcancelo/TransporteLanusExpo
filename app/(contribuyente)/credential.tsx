// app/credential.tsx

/// <reference types="expo-router/types" />

import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Circle, Defs, Path, Stop, LinearGradient as SvgGradient } from 'react-native-svg';

import { API_CREDENTIAL_DETAILS_URL, CREDENCIAL_VERIFY_URL } from '@/constants/api';

// --- DEFINICIÓN DE TIPOS ---
interface CredentialData {
  token: string;
  estado: string;
  titular_nombre: string;
  titular_dni: string;
  nro_licencia: string;
  tipo_transporte: string;
  expte: string;
  vigencia_inicio: string;
  vigencia_fin: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: string;
  asientos: string;
  conductor_nombre?: string;
  celador_nombre?: string;
  escuela_nombre?: string;
  remiseria_nombre?: string;
}

type IconProps = { color: string; size?: number };
type DetailRowProps = { label: string; value?: string | null };

// --- ICONOS ---
const BackIcon = ({ color }: { color: string }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const LogoutIcon = ({ color }: { color: string }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const ErrorIcon = ({ color }: IconProps) => <Svg width={64} height={64} viewBox="0 0 24 24" fill="none"><Path d="M12 2l10 18H2L12 2z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const UserPlaceholderIcon = () => (
  <Svg width={80} height={80} viewBox="0 0 80 80" fill="none">
    <Circle cx="40" cy="40" r="40" fill="url(#grad)" />
    <Circle cx="40" cy="34" r="14" stroke="#FFF" strokeOpacity="0.8" strokeWidth="2" />
    <Path d="M22 66C22 56.0588 30.0589 48 40 48C49.9411 48 58 56.0588 58 66" stroke="#FFF" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
    <Defs>
      <SvgGradient id="grad" x1="40" y1="0" x2="40" y2="80" gradientUnits="userSpaceOnUse">
        <Stop stopColor="#4FC3F7" />
        <Stop offset="1" stopColor="#039BE5" />
      </SvgGradient>
    </Defs>
  </Svg>
);

// --- EFECTO DE BRILLO SUTIL ---
const ShimmerEffect = () => {
    const { width } = useWindowDimensions();
    const animatedValue = useRef(new Animated.Value(-1)).current;
  
    useEffect(() => {
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 3000,
          delay: 1500,
          useNativeDriver: true,
        })
      ).start();
    }, []);
  
    const translateX = animatedValue.interpolate({
      inputRange: [-1, 1],
      outputRange: [-width, width],
    });
  
    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX }, { rotate: '-35deg' }], opacity: 0.6, zIndex: 1 },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent']}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
    );
  };

// --- COMPONENTES DE UI ---
const DetailRow = ({ label, value }: DetailRowProps) => {
  if (!value) return null;
  const styles = getStyles();
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2} ellipsizeMode='tail'>{value}</Text>
    </View>
  );
};

const CredentialCard = ({ data }: { data: CredentialData }) => {
  const styles = getStyles();
  const qrValue = `${CREDENCIAL_VERIFY_URL}?token=${data.token}`;
  
  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'vigente': return { color: '#2E7D32', textColor: '#FFFFFF', text: 'Vigente' };
        case 'en tramite': return { color: '#FF8F00', textColor: '#FFFFFF', text: 'En Trámite' };
        case 'vencido': return { color: '#C62828', textColor: '#FFFFFF', text: 'Vencida' };
        default: return { color: '#757575', textColor: '#FFFFFF', text: (status || 'Desconocido') };
    }
  };
  const statusInfo = getStatusStyle(data.estado);

  return (
    <View style={styles.card}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header con gradiente */}
        <LinearGradient colors={['#29B6F6', '#0288D1']} style={styles.cardHeader}>
            <ShimmerEffect />
            <View style={styles.logoContainer}>
                <Image source={{ uri: 'https://api.transportelanus.com.ar/logo2.png' }} style={styles.logo} resizeMode="contain"/>
            </View>
            <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Lanus Gobierno</Text>
                <Text style={styles.headerSubtitle}>Sub Secretaria de Ordenamiento Urbano</Text>
                <Text style={styles.headerSubtitle}>Direccion Gral. de Movilidad y Transporte</Text>
            </View>
        </LinearGradient>

        {/* Profile */}
        <View style={styles.profileSection}>
          <UserPlaceholderIcon />
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>{data.titular_nombre || 'Nombre no disponible'}</Text>
            <Text style={styles.profileDni}>DNI: {data.titular_dni || 'N/A'}</Text>
          </View>
        </View>

        {/* QR & Status */}
        <View style={styles.qrStatusSection}>
          <View style={styles.qrContainer}>
            {data.token ? <QRCode value={qrValue} size={130} backgroundColor='#FFF' color='#01579B' /> : <Text>QR no disponible</Text>}
          </View>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>ESTADO DE HABILITACIÓN</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Text style={[styles.statusText, { color: statusInfo.textColor }]}>{statusInfo.text.toUpperCase()}</Text>
            </View>
            <Text style={styles.validityLabel}>Vigencia</Text>
            <Text style={styles.validityText}>{`${data.vigencia_inicio || 'N/A'} al ${data.vigencia_fin || 'N/A'}`}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <DetailRow label="Licencia / Expediente" value={`${data.nro_licencia} / ${data.expte}`} />
          <DetailRow label="Tipo de Transporte" value={data.tipo_transporte} />
        </View>
        <View style={styles.detailsContainer}>
          <DetailRow label="Dominio" value={data.patente} />
          <DetailRow label="Marca / Modelo" value={`${data.marca || ''} / ${data.modelo || ''}`} />
          <DetailRow label="Año / Asientos" value={`${data.anio} / ${data.asientos}`} />
        </View>
        
        {(data.conductor_nombre || data.celador_nombre) && (
          <View style={styles.detailsContainer}>
            <DetailRow label="Conductor" value={data.conductor_nombre} />
            <DetailRow label="Celador" value={data.celador_nombre} />
          </View>
        )}
        {(data.escuela_nombre || data.remiseria_nombre) && (
           <View style={styles.detailsContainer}>
             <DetailRow label="Establecimiento" value={data.escuela_nombre} />
             <DetailRow label="Remisería" value={data.remiseria_nombre} />
           </View>
        )}
      </ScrollView>
    </View>
  );
};

// --- PANTALLA PRINCIPAL ---
export default function CredentialScreen() {
  const router = useRouter();
  const { licenseToken } = useLocalSearchParams<{ licenseToken: string }>();
  const styles = getStyles();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credentialData, setCredentialData] = useState<CredentialData | null>(null);
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchCredentialDetails = async () => {
      if (!licenseToken) {
        setError("Token de licencia no proporcionado.");
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(API_CREDENTIAL_DETAILS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ token: licenseToken }),
        });
        const result = await response.json();
        if (response.ok && result.status === 'success') {
          setCredentialData(result.data);
          Animated.spring(cardAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
        } else {
          throw new Error(result.message || "No se pudieron cargar los datos de la credencial.");
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCredentialDetails();
  }, [licenseToken]);

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color="#0288D1" />;
    }
    if (error) {
      return (
        <View style={styles.messageContainer}>
          <ErrorIcon color="#D32F2F" />
          <Text style={styles.errorTitle}>Acceso Denegado</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      );
    }
    if (credentialData) {
      const cardStyle = {
        opacity: cardAnim,
        transform: [
          {
            scale: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.95, 1],
            }),
          },
           {
            translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [40, 0],
            }),
          }
        ],
      };
      return (
        <Animated.View style={[{ flex: 1, width: '100%' }, cardStyle]}>
          <CredentialCard data={credentialData} />
        </Animated.View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#E1F5FE', '#B3E5FC']} style={StyleSheet.absoluteFill} />
      <View style={styles.headerActionsContainer}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <BackIcon color="#01579B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.replace('/')}>
            <LogoutIcon color="#01579B" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

// --- ESTILOS ---
const getStyles = () => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E1F5FE' },
  headerActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 10,
    width: '100%',
  },
  headerButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 99,
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  
  // Card Styles
  card: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#01579B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  scrollContent: { paddingBottom: 20 },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden'
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  logo: {
    width: 52,
    height: 52,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#E1F5FE',
    fontSize: 11,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 1,
    lineHeight: 14,
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: -20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20
  },
  profileTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    color: '#01579B',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileDni: {
    color: '#546E7A',
    fontSize: 14,
    marginTop: 2,
  },

  qrStatusSection: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
    paddingHorizontal: 20
  },
  qrContainer: {
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statusLabel: {
    color: '#546E7A',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  validityLabel: {
    color: '#546E7A',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
  },
  validityText: {
    color: '#01579B',
    fontSize: 14,
    fontWeight: '500',
  },

  detailsContainer: {
    backgroundColor: '#F5FAFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 20
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  detailLabel: {
    color: '#546E7A',
    fontSize: 13,
  },
  detailValue: {
    color: '#0D47A1',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  
  // Message Styles
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: -50,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C62828',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#455A64',
    textAlign: 'center',
    marginBottom: 24,
  },
});
