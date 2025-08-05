import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Define the props we need for the mock camera
interface MockCameraProps {
  style?: any;
  ratio?: string;
  onBarCodeScanned?: (data: { type: string; data: string }) => void;
  children?: React.ReactNode;
}

// Create mock for Camera permissions functions
export const Camera = {
  requestCameraPermissionsAsync: async () => ({ status: 'granted' }),
  getCameraPermissionsAsync: async () => ({ status: 'granted' }),
  requestMicrophonePermissionsAsync: async () => ({ status: 'granted' }),
  getMicrophonePermissionsAsync: async () => ({ status: 'granted' }),
};

// Mock Camera component that renders a placeholder view
export const MockCamera: React.FC<MockCameraProps> = ({ 
  style, 
  onBarCodeScanned,
  children 
}) => {
  // Simulate scanning a QR code when the user taps the component
  const simulateScan = () => {
    if (onBarCodeScanned) {
      onBarCodeScanned({
        type: 'qr',
        data: JSON.stringify({
          id: '12345',
          tipo: 'credencial',
          nombre: 'Usuario de Prueba',
          vehiculo: 'ABC123'
        })
      });
    }
  };

  return (
    <View style={[styles.container, style]}>
      {children}
      <View style={styles.mockCameraContent}>
        <Text style={styles.mockText}>CÁMARA SIMULADA</Text>
        <Text style={styles.mockSubText}>Toque aquí para simular un escaneo de QR</Text>
        <View style={styles.scanButton} onTouchEnd={simulateScan}>
          <Text style={styles.scanButtonText}>Simular Escaneo</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockCameraContent: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  mockText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mockSubText: {
    color: '#ddd',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 5,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MockCamera;
