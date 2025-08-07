// =================================================================================
// ARCHIVO: app/(inspector)/inspection-form.tsx (v9.1 - Con Depuración de Payload)
// DESCRIPCIÓN: Formulario de inspección completo con bloque de depuración
//              para analizar los datos enviados al servidor.
// =================================================================================

import { getPendingInspections, savePendingInspections } from '../../src/utils/offlineQueue';
import { useNetInfo } from '@react-native-community/netinfo';
import type { ImagePickerAsset } from 'expo-image-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, LayoutAnimation, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import SignatureScreen, { type SignatureViewRef } from 'react-native-signature-canvas';
import { Circle, Path, Svg } from 'react-native-svg';

import { API_GUARDAR_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '../../src/hooks/useTheme';
import AppHeader from '@/components/AppHeader';
import type { Vehiculo } from '../../src/types/habilitacion';
import { createInitialItems, groupItemsByCategory } from './InspectionConfig';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}



// --- Definiciones de Tipos ---

interface LocationData { latitude: number; longitude: number; timestamp: number | null; }
interface Photo extends ImagePickerAsset { location: LocationData | null; }
interface InspectionItem { id: string; nombre: string; categoria: string; estado: 'bien' | 'regular' | 'mal' | null; observacion: string; foto: Photo | null; }
interface Habilitacion { id: string; nro_licencia: string; tipo_transporte: string; }
interface Titular { nombre: string; dni: string; email?: string; }
interface Turno { id?: number; fecha: string; hora: string; estado: string; }

interface Tramite {
    habilitacion: Habilitacion | null;
    titular: Titular | null;
    vehiculo: Vehiculo | null;
    turno: Turno | null;
}



const toLocationData = (loc: Location.LocationObject | null): LocationData | null => loc ? { latitude: loc.coords.latitude, longitude: loc.coords.longitude, timestamp: loc.timestamp } : null;

// --- Componente Principal ---
export default function InspectionFormScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { session, setPendingCount, signOut } = useAuth();
    const netInfo = useNetInfo();
    const { colors, colorScheme } = useTheme();

    const tramite: Tramite | null = useMemo(() => {
        try {
            return params.tramite ? JSON.parse(params.tramite as string) : null;
        } catch (e) {
            console.error("Error al parsear 'tramite' desde los parámetros:", e);
            return null;
        }
    }, [params.tramite]);

    const [items, setItems] = useState<InspectionItem[]>(() => createInitialItems(tramite?.habilitacion?.tipo_transporte));
    const [vehiclePhotos, setVehiclePhotos] = useState<{ [key: string]: Photo }>({});
    const [optionalPhoto, setOptionalPhoto] = useState<Photo | null>(null);
    const [inspectorSignature, setInspectorSignature] = useState<string | null>(null);
    const [contributorSignature, setContributorSignature] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [openCategory, setOpenCategory] = useState<string | null>(Object.keys(groupItemsByCategory(items))[0] || null);
    const [signatureModal, setSignatureModal] = useState<{ visible: boolean; type: 'inspector' | 'contributor' | null }>({ visible: false, type: null });
    const [sendEmailCopy, setSendEmailCopy] = useState(true);
    const [observingItemId, setObservingItemId] = useState<string | null>(null);

    const inspectorSignatureRef = useRef<SignatureViewRef>(null);
    const contributorSignatureRef = useRef<SignatureViewRef>(null);

    const styles = useMemo(() => StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
        container: { flex: 1, padding: 15, backgroundColor: colors.background },
        progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
        step: { alignItems: 'center', flex: 1 },
        stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
        stepNumber: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary },
        stepLabel: { marginTop: 8, fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
        stepLine: { height: 2, backgroundColor: colors.border, flex: 1, marginHorizontal: -15 },
        contentContainer: { flex: 1, justifyContent: 'center' },
        navigationContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 15, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.cardBackground, paddingHorizontal: 15, paddingBottom: 15 },
        navButton: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 },
        navButtonDisabled: { opacity: 0.5 },
        navButtonText: { color: colors.textSecondary, fontWeight: 'bold', fontSize: 16 },
        navButtonPrimary: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.primary, elevation: 2, shadowColor: colors.black, shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
        navButtonPrimaryText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
        card: { backgroundColor: colors.cardBackground, borderRadius: 12, marginBottom: 15, padding: 15, borderWidth: 1, borderColor: colors.border, },
        categoryContainer: { backgroundColor: colors.cardBackground, borderRadius: 12, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, elevation: 1, shadowColor: colors.black, shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: {width: 0, height: 1} },
        categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
        categoryTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
        itemsList: { paddingTop: 0, paddingBottom: 10, paddingHorizontal: 15 },
        itemContainer: { paddingVertical: 15, borderTopWidth: 1, borderTopColor: colors.border },
        itemTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
        estadoContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
        estadoButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
        estadoButtonText: { fontWeight: '600' },
        centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
        stepInfoText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 },
        photoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
        photoSlot: { width: '48%', marginBottom: 15 },
        addPhotoButton: { height: 120, borderRadius: 10, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
        addPhotoButtonText: { marginTop: 8, color: colors.primary, fontWeight: '600' },
        thumbnail: { width: '100%', height: 120, borderRadius: 10 },
        thumbnailWrapper: { position: 'relative', width: '100%', elevation: 3, shadowColor: colors.black, shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } },
        removePhotoButton: { position: 'absolute', top: -10, right: -10, backgroundColor: colors.error, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 4 },
        removePhotoButtonText: { color: colors.white, fontWeight: 'bold', fontSize: 16, lineHeight: 18 },
        cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
        signaturePlaceholder: { height: 150, backgroundColor: colors.background, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' },
        signaturePlaceholderText: { color: colors.textSecondary, fontWeight: '600', fontSize: 16 },
        signatureImage: { width: '100%', height: 150, borderRadius: 12 },
        signatureButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
        signatureButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
        signatureButtonText: { fontWeight: 'bold' },
        modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
        modalContent: { width: '95%', height: '90%', backgroundColor: colors.cardBackground, borderRadius: 15, overflow: 'hidden' },
        signatureHeader: { padding: 15, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.primary },
        signatureTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white, textAlign: 'center' },
        signatureFooter: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border },
        checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, padding: 15, backgroundColor: colors.cardBackground, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
        checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: colors.primary, borderRadius: 4, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
        checkboxLabel: { flex: 1, fontSize: 15, color: colors.text },
        textInputObservacion: { minHeight: 80, textAlignVertical: 'top', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 15, color: colors.text },
        observationWrapper: { marginTop: 10 },
        observationButton: { alignSelf: 'flex-start', marginTop: 8 },
        observationButtonText: { color: colors.primary, fontWeight: '600' },
        observationText: { fontStyle: 'italic', color: colors.textSecondary, backgroundColor: colors.background, padding: 10, borderRadius: 6 },
        evidencePhotoContainer: { alignItems: 'center', marginTop: 10 },
        sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 15, marginTop: 10 },
        vehiclePhotoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
        vehiclePhotoSlot: { width: '48%', marginBottom: 15 },
        vehiclePhotoLabel: { textAlign: 'center', color: colors.text, marginTop: 5 },
        optionalPhotoContainer: { marginTop: 10 },
        signatureConfirmation: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: colors.background, borderRadius: 8, marginTop: 10 },
        mainTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 8 },
        subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 },
        stepContent: { flex: 1 },
        footerNav: { flexDirection: 'row', justifyContent: 'space-between', padding: 15 },
        modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white, textAlign: 'center' },
        modalCloseButton: { padding: 10 },
        modalCloseButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
    }), [colors]);

    const hasIssues = useMemo(() => items.some(item => item.estado === 'regular' || item.estado === 'mal'), [items]);

    const ProgressBar = ({ currentStep, steps }: { currentStep: number, steps: string[] }) => {
        return (
            <View style={styles.progressContainer}>
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === currentStep;
                    const isCompleted = stepNumber < currentStep;
                    return (
                        <React.Fragment key={step}>
                            <View style={styles.step}>
                                <View style={[styles.stepCircle, (isActive || isCompleted) && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                                    {isCompleted ? (
                                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth={3}><Path d="M20 6L9 17l-5-5" /></Svg>
                                    ) : (
                                        <Text style={[styles.stepNumber, (isActive || isCompleted) && { color: colors.white }]}>{stepNumber}</Text>
                                    )}
                                </View>
                                <Text style={[styles.stepLabel, isActive && { color: colors.primary, fontWeight: '700' }]}>{step}</Text>
                            </View>
                            {stepNumber < steps.length && <View style={[styles.stepLine, isCompleted && { backgroundColor: colors.primary }]} />}
                        </React.Fragment>
                    );
                })}
            </View>
        );
    };

    const steps = useMemo(() => {
        const baseSteps = ['Verificación'];
        if (hasIssues) {
            baseSteps.push('Evidencia');
        }
        baseSteps.push('Fotos Vehículo');
        baseSteps.push('Firmas');
        return baseSteps;
    }, [hasIssues]);

    if (!session) {
        return <View style={styles.centeredMessage}><ActivityIndicator size="large" color={colors.primary} /><Text>Cargando sesión...</Text></View>;
    }
    
    const vehiclePhotoSlots = [
        { key: 'frente', label: 'Frente del Vehículo' },
        { key: 'contrafrente', label: 'Parte Trasera' },
        { key: 'lateral_izq', label: 'Lateral Izquierdo' },
        { key: 'lateral_der', label: 'Lateral Derecho' },
    ];

    const toggleCategory = (categoria: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpenCategory(openCategory === categoria ? null : categoria);
    };

    const takePictureWithLocation = async (callback: (photo: ImagePickerAsset, location: Location.LocationObject | null) => void) => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== 'granted') { Alert.alert("Permiso Requerido", "Se necesita acceso a la cámara."); return; }
        
        let location: Location.LocationObject | null = null;
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        if (locationStatus === 'granted') { 
            try { location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }); } 
            catch (err) { console.warn("Advertencia de Ubicación: No se pudo obtener la ubicación.", err); } 
        }
        
        const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
        if (!result.canceled && result.assets) {
            callback(result.assets[0], location);
        }
    };

    const handleNextStep = () => {
        if (currentStep === 1 && items.some(item => !item.estado)) {
            Alert.alert("Atención", "Debe calificar todos los ítems antes de continuar.");
            return;
        }
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };
    
    const handlePrevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };
    const handleTakePhotoForItem = (itemId: string) => takePictureWithLocation((photo, location) => setItems(current => current.map(item => item.id === itemId ? { ...item, foto: { ...photo, location: toLocationData(location) } } : item)));
    const handleRemovePhotoForItem = (itemId: string) => setItems(current => current.map(item => item.id === itemId ? { ...item, foto: null } : item));
    const handleTakeVehiclePhoto = (slotKey: string) => takePictureWithLocation((photo, location) => setVehiclePhotos(prev => ({ ...prev, [slotKey]: { ...photo, location: toLocationData(location) } })));
    const handleRemoveVehiclePhoto = (slotKey: string) => setVehiclePhotos(prev => { const newState = { ...prev }; delete newState[slotKey]; return newState; });
    const handleTakeOptionalPhoto = () => takePictureWithLocation((photo, location) => setOptionalPhoto({ ...photo, location: toLocationData(location) }));
    const handleRemoveOptionalPhoto = () => setOptionalPhoto(null);

    const ensureDataUriPrefix = (signature: string): string => {
        if (signature.startsWith('data:image/png;base64,')) {
            return signature;
        }
        return 'data:image/png;base64,' + signature;
    };

    const handleSubmit = async () => {
        const resultadoInspeccion = items.some(item => item.estado === 'mal') ? 'rechazado' : 'aprobado';

        if (!inspectorSignature) {
            Alert.alert("Atención", "La firma del inspector es indispensable para finalizar.");
            return;
        }

        if (!tramite || !tramite.habilitacion || !tramite.turno) {
            Alert.alert("Error", "Faltan datos esenciales del trámite, la habilitación o el turno para continuar.");
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(true);

        const payload = {
            estado: 'finalizado',
            resultado: resultadoInspeccion,
            // Información del turno con estado actualizado
            turno: { 
                ...tramite.turno, 
                estado: 'Finalizado',
                fecha_finalizacion: new Date().toISOString()
            },
            // También enviar el ID del turno por separado para que el backend pueda actualizarlo directamente
            turno_id: tramite.turno.id || null,
            turno_estado: 'Finalizado',
            // Información adicional para asegurar la actualización del estado
            actualizar_turno: true,
            estado_anterior_turno: tramite.turno.estado,
            habilitacion_id: tramite.habilitacion.id,
            nro_licencia: tramite.habilitacion.nro_licencia,
            nombre_inspector: session?.nombre || 'Inspector',
            firma_inspector: inspectorSignature,
            firma_contribuyente: contributorSignature,
            // Asegurar que siempre se marque como finalizado cuando se envía
            status_inspeccion: 'Finalizado',
            fecha_finalizacion: new Date().toISOString(),
            fotos_vehiculo: {
                frente: vehiclePhotos.frente ? { foto: vehiclePhotos.frente.base64, location: vehiclePhotos.frente.location } : null,
                contrafrente: vehiclePhotos.contrafrente ? { foto: vehiclePhotos.contrafrente.base64, location: vehiclePhotos.contrafrente.location } : null,
                lateral_izq: vehiclePhotos.lateral_izq ? { foto: vehiclePhotos.lateral_izq.base64, location: vehiclePhotos.lateral_izq.location } : null,
                lateral_der: vehiclePhotos.lateral_der ? { foto: vehiclePhotos.lateral_der.base64, location: vehiclePhotos.lateral_der.location } : null,
            },
            foto_adicional: optionalPhoto ? { foto: optionalPhoto.base64, location: optionalPhoto.location } : null,
            tipo_transporte: tramite?.habilitacion?.tipo_transporte,
            email_contribuyente: tramite?.titular?.email,
            titular: tramite?.titular,
            vehiculo: tramite?.vehiculo,
            sendEmailCopy: sendEmailCopy,
            items: items.map(item => ({
                id: item.id,
                nombre: item.nombre,
                categoria: item.categoria,
                estado: item.estado,
                observacion: item.observacion,
                foto: item.foto?.base64 || null,
                location: item.foto?.location || null
            })),
        };
        
        // =================================================================
        // =========== BLOQUE DE DEPURACIÓN INTEGRADO ======================
        // =================================================================
        console.log("--- DEBUG DEL PAYLOAD ANTES DE ENVIAR ---");
        console.log("🔍 INFORMACIÓN DEL TURNO:");
        console.log(`- Estado anterior: ${tramite.turno.estado}`);
        console.log(`- Estado nuevo: Finalizado`);
        console.log(`- ID del turno: ${tramite.turno.id || 'NO DISPONIBLE'}`);
        console.log(`- Fecha: ${tramite.turno.fecha}`);
        console.log(`- Hora: ${tramite.turno.hora}`);
        
        try {
            const payloadStringForDebugging = JSON.stringify(payload, null, 2);
            console.log("📦 PAYLOAD COMPLETO:");
            console.log(payloadStringForDebugging);
            
            // Mostrar información crítica del turno en un alert para debugging
            Alert.alert(
                "🔍 DEBUG - Información del Turno", 
                `Estado anterior: ${tramite.turno.estado}\n` +
                `Estado nuevo: Finalizado\n` +
                `ID del turno: ${tramite.turno.id || 'NO DISPONIBLE'}\n` +
                `¿Actualizar turno?: ${payload.actualizar_turno}\n\n` +
                `¿Continuar con el envío?`,
                [
                    { text: 'Cancelar', style: 'cancel', onPress: () => { setIsSubmitting(false); return; } },
                    { text: 'Continuar', onPress: () => {} }
                ]
            );

            if (!payloadStringForDebugging || payloadStringForDebugging === '{}') {
                Alert.alert("Error de la App", "Se intentó enviar una inspección vacía. Revisa los datos.");
                setIsSubmitting(false);
                return;
            }
        } catch (error: any) {
            console.error("¡ERROR AL CONVERTIR EL PAYLOAD A JSON!", error);
            Alert.alert("Error Crítico de la App", `No se pudo construir el paquete de datos para enviar. Error: ${error.message}`);
            setIsSubmitting(false);
            return;
        }
        // =================================================================
        // =================== FIN DEL BLOQUE DE DEPURACIÓN ==================
        // =================================================================

        const saveLocally = async () => { 
            try { 
                const queue = await getPendingInspections(); 
                queue.push(payload); 
                await savePendingInspections(queue); 
                if (setPendingCount) {
                    const newCount = await getPendingInspections(); 
                    setPendingCount(newCount.length); 
                }
                
                // Mensaje mejorado para guardado local
                const offlineMessage = `✅ INSPECCIÓN FINALIZADA (Guardada Localmente)\n\n` +
                    `• Estado: Finalizado\n` +
                    `• Resultado: ${resultadoInspeccion === 'aprobado' ? 'Aprobado' : 'Rechazado'}\n` +
                    `• Licencia: ${tramite.habilitacion?.nro_licencia || 'N/A'}\n` +
                    `• Fecha: ${new Date().toLocaleDateString('es-AR')}\n\n` +
                    `La inspección se enviará automáticamente cuando haya conexión a internet.`;
                
                Alert.alert("📶 Inspección Completada (Sin Conexión)", offlineMessage);
                
                console.log(`✅ INSPECCIÓN FINALIZADA (OFFLINE) - Licencia: ${tramite.habilitacion?.nro_licencia || 'N/A'}, Estado: Finalizado, Resultado: ${resultadoInspeccion}`);
                
                router.replace('/(inspector)/inspecciones'); 
            } catch (err: any) { 
                Alert.alert("Error", `No se pudo guardar la inspección localmente: ${err.message}`); 
            } 
        };

        if (netInfo.isConnected) {
            try {
                const response = await fetch(API_GUARDAR_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                const responseText = await response.text();
                console.log("Respuesta cruda del servidor:", responseText);
                const result = JSON.parse(responseText);
                if (response.ok && result.status === 'success') {
                    // Mostrar mensaje de éxito específico para inspección finalizada
                    const successMessage = `✅ INSPECCIÓN FINALIZADA EXITOSAMENTE\n\n` +
                        `• Estado: Finalizado\n` +
                        `• Resultado: ${resultadoInspeccion === 'aprobado' ? 'Aprobado' : 'Rechazado'}\n` +
                        `• Licencia: ${tramite.habilitacion?.nro_licencia || 'N/A'}\n` +
                        `• Fecha: ${new Date().toLocaleDateString('es-AR')}\n\n` +
                        `${result.message || 'La inspección se ha guardado correctamente en la base de datos.'}`;
                    
                    Alert.alert("🎉 Inspección Completada", successMessage, [
                        { 
                            text: 'OK', 
                            onPress: () => {
                                // Actualizar contador de pendientes si existe
                                if (setPendingCount) {
                                    getPendingInspections().then(queue => {
                                        setPendingCount(queue.length);
                                    });
                                }
                                router.replace('/(inspector)/inspecciones');
                            }
                        }
                    ]);
                    
                    console.log(`✅ INSPECCIÓN FINALIZADA - Licencia: ${tramite.habilitacion?.nro_licencia || 'N/A'}, Estado: Finalizado, Resultado: ${resultadoInspeccion}`);
                    
                } else {
                    throw new Error(result.message || `Error del servidor: ${response.status}`);
                }
            } catch (err: any) {
                console.error("Error en fetch o parseo:", err);
                Alert.alert("Error de Conexión", `No se pudo enviar. Se guardará localmente.\n\nError: ${err.message}`, [{ text: 'OK', onPress: saveLocally }]);
            } finally {
                setIsSubmitting(false);
            }
        } else {
            saveLocally();
            setIsSubmitting(false);
        }
    };
    
    const renderItemsStep = () => {
        const statusOptions: ('Bien' | 'Regular' | 'Mal')[] = ['Bien', 'Regular', 'Mal'];
        const handleToggleObservation = (itemId: string) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setObservingItemId(observingItemId === itemId ? null : itemId);
        };

        return (
            <ScrollView showsVerticalScrollIndicator={false}>
                {Object.entries(groupItemsByCategory(items)).map(([categoria, itemsDeCategoria]) => (
                    <View key={categoria} style={styles.categoryContainer}>
                        <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCategory(categoria)} activeOpacity={0.8}>
                            <Text style={styles.categoryTitle}>{categoria}</Text>
                            <Svg width={20} height={20} viewBox="0 0 24 24" stroke={colors.primary} strokeWidth={3} fill="none">
                                <Path d={openCategory === categoria ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                            </Svg>
                        </TouchableOpacity>
                        {openCategory === categoria && (
                            <View style={styles.itemsList}>
                                {itemsDeCategoria.map((item: InspectionItem) => {
                                    const isObserving = observingItemId === item.id;
                                    return (
                                        <View key={item.id} style={styles.itemContainer}>
                                            <Text style={styles.itemTitle}>{item.nombre}</Text>
                                            <View style={styles.estadoContainer}>
                                                {statusOptions.map((estado) => {
                                                    const estadoLower = estado.toLowerCase() as 'bien' | 'regular' | 'mal';
                                                    const isSelected = item.estado === estadoLower;
                                                    const statusColor = estado === 'Bien' ? colors.success : estado === 'Regular' ? colors.warning : colors.error;
                                                    return (
                                                        <TouchableOpacity key={estado} style={[styles.estadoButton, isSelected && { backgroundColor: statusColor }]} onPress={() => setItems(current => current.map(i => i.id === item.id ? { ...i, estado: estadoLower } : i))}>
                                                            <Text style={[styles.estadoButtonText, { color: isSelected ? colors.white : colors.textSecondary }]}>{estado}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                            
                                            <View style={styles.observationWrapper}>
                                                {item.observacion && !isObserving && (
                                                    <Text style={styles.observationText}>{item.observacion}</Text>
                                                )}

                                                {isObserving && (
                                                    <TextInput
                                                        style={styles.textInputObservacion}
                                                        placeholder="Escriba aquí..."
                                                        placeholderTextColor={colors.textSecondary}
                                                        value={item.observacion}
                                                        onChangeText={text => setItems(current => current.map(i => i.id === item.id ? { ...i, observacion: text } : i))}
                                                        multiline
                                                        autoFocus={true}
                                                    />
                                                )}

                                                <TouchableOpacity style={styles.observationButton} onPress={() => handleToggleObservation(item.id)}>
                                                    <Text style={styles.observationButtonText}>
                                                        {isObserving ? 'Ocultar' : (item.observacion ? 'Editar Observación' : '+ Añadir Observación')}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        );
    }

    const renderEvidenceStep = () => {
        const itemsWithIssues = items.filter(item => item.estado === 'regular' || item.estado === 'mal');

        if (itemsWithIssues.length === 0 && hasIssues) {
            return (
               <View style={styles.centeredMessage}>
                    <Text style={styles.stepInfoText}>Todos los ítems fueron corregidos a ‘Bien’. Puede continuar al siguiente paso.</Text>
                </View>
            );
        }

        return (
            <ScrollView contentContainerStyle={{paddingBottom: 20}} showsVerticalScrollIndicator={false}>
                <Text style={styles.stepInfoText}>Adjunte una foto como evidencia para cada ítem con observaciones.</Text>
                {itemsWithIssues.map(item => (
                    <View key={item.id} style={styles.card}>
                        <Text style={styles.itemTitle}>{item.nombre}</Text>
                        <View style={styles.evidencePhotoContainer}>
                            {item.foto ? (
                                <View style={styles.thumbnailWrapper}>
                                    <Image source={{ uri: item.foto.uri }} style={styles.thumbnail} />
                                    <TouchableOpacity style={styles.removePhotoButton} onPress={() => handleRemovePhotoForItem(item.id)}>
                                        <Text style={styles.removePhotoButtonText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.addPhotoButton} onPress={() => handleTakePhotoForItem(item.id)} activeOpacity={0.7}>
                                    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth={1.5}>
                                         <Path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <Circle cx="12" cy="13" r="4" />
                                    </Svg>
                                    <Text style={styles.addPhotoButtonText}>Añadir Evidencia</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>
        );
    };

    const renderVehiclePhotosStep = () => (
        <ScrollView contentContainerStyle={{paddingBottom: 20}} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Fotos del Vehículo (Obligatorias)</Text>
                <View style={styles.vehiclePhotoGrid}>
                    {vehiclePhotoSlots.map(slot => (
                        <View key={slot.key} style={styles.vehiclePhotoSlot}>
                            <Text style={styles.vehiclePhotoLabel}>{slot.label}</Text>
                            {vehiclePhotos[slot.key] ? (
                                <View style={styles.thumbnailWrapper}>
                                    <Image source={{ uri: vehiclePhotos[slot.key].uri }} style={styles.thumbnail} />
                                    <TouchableOpacity style={styles.removePhotoButton} onPress={() => handleRemoveVehiclePhoto(slot.key)}>
                                        <Text style={styles.removePhotoButtonText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.addPhotoButton} onPress={() => handleTakeVehiclePhoto(slot.key)} activeOpacity={0.7}>
                                    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth={1.5}>
                                        <Path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <Circle cx="12" cy="13" r="4" />
                                    </Svg>
                                    <Text style={styles.addPhotoButtonText}>Añadir</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>
            </View>
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Foto Adicional (Opcional)</Text>
                    <View style={styles.optionalPhotoContainer}>
                        {optionalPhoto ? (
                            <View style={styles.thumbnailWrapper}>
                                <Image source={{ uri: optionalPhoto.uri }} style={[styles.thumbnail, {height: 200}]} />
                                <TouchableOpacity style={styles.removePhotoButton} onPress={handleRemoveOptionalPhoto}>
                                    <Text style={styles.removePhotoButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={[styles.addPhotoButton, {height: 120}]} onPress={handleTakeOptionalPhoto} activeOpacity={0.7}>
                               <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth={1.5}><Path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><Circle cx="12" cy="13" r="4" /></Svg>
                                <Text style={styles.addPhotoButtonText}>Tomar Foto Adicional</Text>
                            </TouchableOpacity>
                        )}
                    </View>
            </View>
        </ScrollView>
    );

    const renderSignaturesStep = () => (
        <ScrollView contentContainerStyle={{paddingBottom: 20}} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepInfoText}>Realice las firmas de conformidad para finalizar el reporte.</Text>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Firma de Conformidad del Inspector</Text>
                <TouchableOpacity onPress={() => setSignatureModal({ visible: true, type: 'inspector' })} style={styles.signaturePlaceholder}>
                    {inspectorSignature ? ( <Image source={{ uri: inspectorSignature }} style={styles.signatureImage} resizeMode="contain" />) : (<Text style={styles.signaturePlaceholderText}>Tocar aquí para firmar</Text>)}
                </TouchableOpacity>
                {inspectorSignature && <Text style={styles.signatureConfirmation}>✓ Firma Guardada</Text>}
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Firma del Contribuyente (Opcional)</Text>
                <TouchableOpacity onPress={() => setSignatureModal({ visible: true, type: 'contributor' })} style={styles.signaturePlaceholder}>
                    {contributorSignature ? (<Image source={{ uri: contributorSignature }} style={styles.signatureImage} resizeMode="contain" /> ) : ( <Text style={styles.signaturePlaceholderText}>Tocar aquí para firmar</Text> )}
                </TouchableOpacity>
                {contributorSignature && <Text style={styles.signatureConfirmation}>✓ Firma Guardada</Text>}
            </View>

            {tramite?.titular?.email && (
              <View style={styles.card}>
                <View style={styles.checkboxContainer}>
                    <TouchableOpacity style={styles.checkbox} onPress={() => setSendEmailCopy(!sendEmailCopy)} activeOpacity={1}>
                        {sendEmailCopy && (
                            <Svg width={18} height={18} viewBox="0 0 24 24" stroke={colors.primary} strokeWidth={3} fill="none"><Path d="M20 6L9 17l-5-5" /></Svg>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.checkboxLabel}>Enviar copia de la inspección por email</Text>
                </View>
              </View>
            )}
        </ScrollView>
    );

    const renderStepContent = () => {
        const stepName = steps[currentStep - 1];
        switch (stepName) {
            case 'Verificación': return renderItemsStep();
            case 'Evidencia': return renderEvidenceStep();
            case 'Fotos Vehículo': return renderVehiclePhotosStep();
            case 'Firmas': return renderSignaturesStep();
            default: return null;
        }
    };

    // Android-specific container style to ensure content is below status bar
    const androidContainerStyle = {
        flex: 1,
        backgroundColor: colors.background,
        ...(Platform.OS === 'android' && {
            paddingTop: StatusBar.currentHeight || 0,
        })
    };

    if (!tramite) {
        return (
            <View style={androidContainerStyle}>
                <StatusBar 
                    barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
                    backgroundColor={colors.background} 
                    translucent={false}
                />
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.container}><Text>Error: Datos del trámite no encontrados.</Text></View>
                </SafeAreaView>
            </View>
        )
    }

    return (
        <View style={androidContainerStyle}>
            <StatusBar 
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
                backgroundColor={colors.background} 
                translucent={false}
            />
            <SafeAreaView style={styles.safeArea}>
                <AppHeader user={session} onLogout={signOut} />
                <Stack.Screen 
                    options={{
                        title: `Inspección para Licencia ${tramite?.habilitacion?.nro_licencia ?? ''}`,
                        headerStyle: { backgroundColor: colors.background },
                        headerTintColor: colors.text,
                        headerTitleStyle: { fontWeight: 'bold' }
                    }}
                />
            <View style={styles.container}>
                <Text style={styles.mainTitle}>Formulario de Inspección</Text>
                <Text style={styles.subtitle}>Licencia: {tramite.habilitacion?.nro_licencia || 'N/A'}</Text>
                <ProgressBar currentStep={currentStep} steps={steps} />
                <View style={styles.stepContent}>{renderStepContent()}</View>
                <View style={styles.footerNav}>
                    <TouchableOpacity style={[styles.navButton, currentStep === 1 && styles.navButtonDisabled]} onPress={handlePrevStep} disabled={currentStep === 1} activeOpacity={0.7}><Text style={styles.navButtonText}>Anterior</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.navButtonPrimary} onPress={handleNextStep} disabled={isSubmitting} activeOpacity={0.8}>{isSubmitting && currentStep === steps.length ? <ActivityIndicator color={colors.white} /> : <Text style={styles.navButtonPrimaryText}>{currentStep === steps.length ? 'Finalizar Inspección' : 'Siguiente'}</Text>}</TouchableOpacity>
                </View>
            </View>
            <Modal visible={signatureModal.visible} onRequestClose={() => setSignatureModal({ visible: false, type: null })}>
                <SafeAreaView style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>{signatureModal.type === 'inspector' ? 'Firma del Inspector' : 'Firma del Contribuyente'}</Text>
                    <SignatureScreen
                        ref={signatureModal.type === 'inspector' ? inspectorSignatureRef : contributorSignatureRef}
                        onOK={(sig: string) => {
                            const fullSignatureUri = ensureDataUriPrefix(sig);
                            if (signatureModal.type === 'inspector') {
                                setInspectorSignature(fullSignatureUri);
                            } else {
                                setContributorSignature(fullSignatureUri);
                            }
                            setSignatureModal({ visible: false, type: null });
                        }}
                        onEmpty={() => Alert.alert("Atención", "Por favor, realice una firma.")}
                        descriptionText="" clearText="Limpiar" confirmText="Guardar Firma"
                        penColor={colors.text}
                        webStyle={`.m-signature-pad { box-shadow: none; border: none; } .m-signature-pad--body { border: 2px dashed ${colors.border}; border-radius: 8px; } .m-signature-pad--footer { justify-content: space-around; }`}
                    />
                    <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSignatureModal({ visible: false, type: null })}>
                        <Text style={styles.modalCloseButtonText}>Cerrar sin Guardar</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
        </View>
    );
};

// ...