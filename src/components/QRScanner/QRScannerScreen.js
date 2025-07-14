// src/components/QRScanner/QRScannerScreen.js (Versión Profesional)
import { Camera, CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// --- Iconos y Componentes de UI ---
const BackIcon = ({ color }) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>;

const ScanMarker = () => (
    <>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
    </>
);

// --- Componente Principal del Escáner ---
export const QRScannerScreen = ({ onScan, onClose, themeColors }) => {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const scanLineAnimation = useRef(new Animated.Value(0)).current;

    // Efecto para solicitar permisos de cámara al montar el componente
    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };
        getCameraPermissions();
    }, []);

    // Efecto para la animación de la línea de escaneo
    useEffect(() => {
        const animateScanLine = () => {
            scanLineAnimation.setValue(0); // Reinicia la animación
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanLineAnimation, {
                        toValue: 1,
                        duration: 2500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanLineAnimation, {
                        toValue: 0,
                        duration: 2500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };
        if (hasPermission) {
            animateScanLine();
        }
    }, [hasPermission]);

    // Maneja el dato cuando se escanea un código
    const handleBarCodeScanned = ({ data }) => {
        if (!scanned) {
            setScanned(true); // Evita escaneos múltiples
            onScan(data);
            // El feedback se da en la pantalla de login, aquí solo se escanea
        }
    };

    // Función para abrir la configuración de la app si se deniegan los permisos
    const openAppSettings = () => {
        Linking.openSettings();
    };

    // --- Renderizado Condicional ---
    if (hasPermission === null) {
        return (
            <View style={[styles.container, {backgroundColor: themeColors.background}]}>
                <Text style={{color: themeColors.text, fontSize: 16}}>Solicitando permiso de cámara...</Text>
            </View>
        );
    }
    if (hasPermission === false) {
        return (
            <View style={[styles.container, {backgroundColor: themeColors.background, padding: 20}]}>
                <Text style={[styles.permissionTitle, {color: themeColors.text}]}>Permiso de Cámara Requerido</Text>
                <Text style={[styles.permissionText, {color: themeColors.grayMedium}]}>
                    Para escanear códigos QR, necesitamos acceder a la cámara de tu dispositivo.
                </Text>
                <TouchableOpacity style={[styles.permissionButton, {backgroundColor: themeColors.primary}]} onPress={openAppSettings}>
                    <Text style={styles.permissionButtonText}>Abrir Configuración</Text>
                </TouchableOpacity>
                 <TouchableOpacity style={{marginTop: 20}} onPress={onClose}>
                    <Text style={{color: themeColors.primary}}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // --- Renderizado Principal del Escáner ---
    const scanLineTranslateY = scanLineAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 240], // Se mueve dentro del alto de la caja (250px)
    });

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Overlay y UI */}
            <View style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={onClose}>
                        <BackIcon color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.middle}>
                    <Text style={styles.title}>Escanear Código QR</Text>
                    <View style={styles.scannerBox}>
                        <ScanMarker />
                        <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]}>
                            <LinearGradient
                                colors={['rgba(0, 147, 210, 0)', 'rgba(0, 147, 210, 0.8)', 'rgba(0, 147, 210, 0)']}
                                style={{flex: 1}}
                            />
                        </Animated.View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.subtitle}>Apunta la cámara al código de tu credencial para iniciar sesión.</Text>
                </View>
            </View>
        </View>
    );
};

// --- Estilos Mejorados ---
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    overlay: { flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
    header: { height: 140, justifyContent: 'center' },
    middle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    footer: { height: 160, justifyContent: 'center', alignItems: 'center' },
    
    backButton: { position: 'absolute', top: 60, left: 24, zIndex: 1, padding: 10 },
    title: { fontSize: 22, color: 'white', fontWeight: 'bold', position: 'absolute', top: 0 },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', paddingHorizontal: 50 },
    
    scannerBox: { width: 250, height: 250, position: 'relative', overflow: 'hidden' },
    scanLine: { width: '100%', height: 30, position: 'absolute' },
    
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: 'white',
        borderWidth: 5,
    },
    topLeft: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 15 },
    topRight: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 15 },
    bottomLeft: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 15 },
    bottomRight: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 15 },

    permissionTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
    permissionText: { fontSize: 16, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    permissionButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
    permissionButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});