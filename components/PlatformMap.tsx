// components/PlatformMap.tsx
import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';

// Platform-specific imports
let MapView: any = null;
let Marker: any = null;
let UrlTile: any = null;

if (Platform.OS !== 'web') {
  // Only import react-native-maps on native platforms
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  UrlTile = Maps.UrlTile;
}

interface PlatformMapProps {
  children?: React.ReactNode;
  style?: any;
  initialRegion?: any;
  [key: string]: any;
}

export const PlatformMapView: React.FC<PlatformMapProps> = ({ children, style, ...props }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webMapContainer, style]}>
        <Text style={styles.webMapText}>
          🗺️ Mapa no disponible en web
        </Text>
        <Text style={styles.webMapSubtext}>
          Usa la aplicación móvil para ver el mapa interactivo
        </Text>
      </View>
    );
  }

  if (!MapView) {
    return (
      <View style={[styles.webMapContainer, style]}>
        <Text style={styles.webMapText}>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <MapView style={style} {...props}>
      {children}
    </MapView>
  );
};

export const PlatformMarker: React.FC<any> = (props) => {
  if (Platform.OS === 'web' || !Marker) {
    return null;
  }
  return <Marker {...props} />;
};

export const PlatformUrlTile: React.FC<any> = (props) => {
  if (Platform.OS === 'web' || !UrlTile) {
    return null;
  }
  return <UrlTile {...props} />;
};

const styles = StyleSheet.create({
  webMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  webMapText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#01579B',
    marginBottom: 8,
  },
  webMapSubtext: {
    fontSize: 14,
    color: '#546E7A',
    textAlign: 'center',
    maxWidth: 250,
  },
});
