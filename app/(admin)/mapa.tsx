import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
// PASO 1: Importar useRouter
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PlatformMapView as MapView, PlatformMarker as Marker, PlatformUrlTile as UrlTile } from '../../components/PlatformMap';
import { Callout } from 'react-native-maps';

import { getMapPoints } from '../../src/services/api';
import { MapPoint } from '../../src/types/habilitacion';

const OSM_TILE_TEMPLATE = "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";

// --- Custom Marker Component ---
const CustomMarker = ({ point }: { point: MapPoint }) => {
    const markerStyle = point.tipo === 'educacion' ? styles.markerEducacion : styles.markerRemis;
    const iconName = point.tipo === 'educacion' ? 'book-open' : 'compass';
    return (
        <Marker
            coordinate={{
                latitude: parseFloat(point.latitud),
                longitude: parseFloat(point.longitud),
            }}
            tracksViewChanges={false}
        >
            <View style={markerStyle}>
                <Feather name={iconName} size={18} color="white" />
            </View>
            <Callout style={styles.customCallout}>
                <View>
                    <Text style={styles.calloutTitle}>{point.nombre}</Text>
                    <Text style={styles.calloutText}>Licencias: {point.total_licencias}</Text>
                </View>
            </Callout>
        </Marker>
    );
};

export default function MapaScreen() {
    // PASO 2: Obtener la instancia del router
    const router = useRouter();

    const { data: points, isLoading, isError, refetch } = useQuery({
        queryKey: ['mapPoints'],
        queryFn: getMapPoints,
    });
    
    const mapRef = useRef<any>(null);
    const [initialRegion, setInitialRegion] = useState({
        latitude: -34.7061,
        longitude: -58.3972,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permisos denegados', 'Habilita los permisos de ubicación para centrar el mapa en tu posición.');
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            setInitialRegion({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            });
        })();
    }, []);

    const goToMyLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso de ubicación no concedido.');
            return;
        }
        let location = await Location.getCurrentPositionAsync({});
        mapRef.current?.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.01,
        }, 1000);
    };

    if (isLoading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#007bff" /></View>;
    }

    if (isError || !points) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Error al cargar los puntos del mapa.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                    <Text style={styles.retryText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {/* PASO 3: Añadir headerLeft a las opciones del Stack */}
            <Stack.Screen 
                options={{ 
                    headerShown: true, 
                    title: "Mapa de Unidades",
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                            <Feather name="arrow-left" size={24} color="#007bff" />
                        </TouchableOpacity>
                    ),
                }} 
            />
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                initialRegion={initialRegion}
            >
                <UrlTile
                    urlTemplate={OSM_TILE_TEMPLATE}
                    maximumZ={19}
                />
                
                {points.map(point => (
                    <CustomMarker key={`${point.tipo}-${point.id}`} point={point} />
                ))}
            </MapView>
            <TouchableOpacity style={styles.locationButton} onPress={goToMyLocation}>
                <Feather name="crosshair" size={24} color="#007bff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
    errorText: { fontSize: 16, color: '#d9534f', marginBottom: 15, textAlign: 'center' },
    retryButton: { backgroundColor: '#007bff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    retryText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    customCallout: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 12,
        width: 220,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    calloutTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 5, color: '#333' },
    calloutText: { fontSize: 14, color: '#555' },
    markerEducacion: {
        backgroundColor: '#2563eb', // Azul
        borderRadius: 20,
        padding: 8,
        borderWidth: 2,
        borderColor: 'white',
    },
    markerRemis: {
        backgroundColor: '#f59e0b', // Ámbar
        borderRadius: 20,
        padding: 8,
        borderWidth: 2,
        borderColor: 'white',
    },
    locationButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});