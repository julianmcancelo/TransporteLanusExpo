// =================================================================================
// ARCHIVO: app/(inspector)/inspection-form.tsx (v9.1 - Con Depuración de Payload)
// DESCRIPCIÓN: Formulario de inspección completo con bloque de depuración
//              para analizar los datos enviados al servidor.
// =================================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import type { ImagePickerAsset } from 'expo-image-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, LayoutAnimation, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import SignatureScreen, { type SignatureViewRef } from 'react-native-signature-canvas';
import { Circle, Path, Svg } from 'react-native-svg';

import { API_SAVE_INSPECTION_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { createInitialItems, groupItemsByCategory } from './InspectionConfig';
import type { Vehiculo } from '../../src/types/habilitacion';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}



// --- Definiciones de Tipos ---
interface UserSession { nombre: string; email: string; rol: 'inspector'; legajo: string; token: string; }
interface AuthContextType { userSession: UserSession | null; setPendingCount: (count: number) => void; }
interface LocationData { latitude: number; longitude: number; timestamp: number | null; }
interface Photo extends ImagePickerAsset { location: LocationData | null; }
interface InspectionItem { id: string; nombre: string; categoria: string; estado: 'bien' | 'regular' | 'mal' | null; observacion: string; foto: Photo | null; }
interface Habilitacion { id: string; nro_licencia: string; tipo_transporte: string; }
interface Titular { nombre: string; dni: string; email?: string; }
interface Tramite { habilitacion: Habilitacion; titular: Titular | null; vehiculo: Vehiculo | null; }

const QUEUE_KEY = '@inspeccionQueue';
const getPendingInspections = async (): Promise<any[]> => { try { const q = await AsyncStorage.getItem(QUEUE_KEY); return q ? JSON.parse(q) : []; } catch (e) { console.error("Error al obtener la cola:", e); return []; } };
const savePendingInspections = async (queue: any[]) => { try { await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch (e) { console.error("Error al guardar la cola:", e); } };
const toLocationData = (loc: Location.LocationObject | null): LocationData | null => loc ? { latitude: loc.coords.latitude, longitude: loc.coords.longitude, timestamp: loc.timestamp } : null;

// --- Componente de Barra de Progreso ---
const ProgressBar = ({ currentStep, steps, colors }: { currentStep: number, steps: string[], colors: any }) => {
    const styles = getStyles(colors);
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

// --- Componente Principal ---
const InspectionFormScreen = () => {
    const themeColors = useThemeColors();
    const styles = getStyles(themeColors);
    const router = useRouter();
    const params = useLocalSearchParams();
    const authContext = useAuth() as AuthContextType;
    const netInfo = useNetInfo();
    
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

    const hasIssues = useMemo(() => items.some(item => item.estado === 'regular' || item.estado === 'mal'), [items]);
    
    const steps = useMemo(() => {
        const baseSteps = ['Verificación'];
        if (hasIssues) {
            baseSteps.push('Evidencia');
        }
        baseSteps.push('Fotos Vehículo');
        baseSteps.push('Firmas');
        return baseSteps;
    }, [hasIssues]);

    const { userSession, setPendingCount } = authContext || {};

        if (!userSession) {
        return <View style={styles.centeredMessage}><ActivityIndicator size="large" color={themeColors.primary} /><Text>Cargando sesión...</Text></View>;
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
        if (!inspectorSignature) { Alert.alert("Atención", "La firma del inspector es indispensable para finalizar."); return; }
        setIsSubmitting(true);
        
        const payload = {
            habilitacion_id: tramite?.habilitacion?.id,
            nro_licencia: tramite?.habilitacion?.nro_licencia,
            nombre_inspector: userSession?.nombre || 'Inspector',
            
            firma_inspector: inspectorSignature,
            firma_contribuyente: contributorSignature,
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
        try {
            const payloadStringForDebugging = JSON.stringify(payload, null, 2);
            console.log(payloadStringForDebugging);

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
                Alert.alert("Guardado Localmente", "La inspección se enviará cuando haya conexión."); 
                router.replace('/(inspector)/inspecciones'); 
            } catch (err: any) { 
                Alert.alert("Error", `No se pudo guardar la inspección localmente: ${err.message}`); 
            } 
        };

        if (netInfo.isConnected) { 
            try { 
                const response = await fetch(API_SAVE_INSPECTION_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); 
                
                const responseText = await response.text(); // Leer como texto para depurar
                console.log("Respuesta cruda del servidor:", responseText);

                const result = JSON.parse(responseText); // Intentar parsear el texto

                if (response.ok && result.status === 'success') { 
                    Alert.alert("Éxito", result.message || "Inspección guardada correctamente."); 
                    router.replace('/(inspector)/inspecciones'); 
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
        const statusColorMap = { bien: themeColors.success, regular: themeColors.warning, mal: themeColors.error };
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
                            <Svg width={20} height={20} viewBox="0 0 24 24" stroke={themeColors.primary} strokeWidth={3} fill="none">
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
                                                {statusOptions.map(status => {
                                                    const normalizedStatus = status.toLowerCase() as 'bien' | 'regular' | 'mal';
                                                    const isSelected = item.estado === normalizedStatus;
                                                    const buttonColor = isSelected ? statusColorMap[normalizedStatus] : themeColors.background;
                                                    const textColor = isSelected ? themeColors.white : themeColors.text;
                                                    const borderColor = isSelected ? statusColorMap[normalizedStatus] : themeColors.border;

                                                    return (
                                                        <TouchableOpacity
                                                            key={status}
                                                            style={[styles.estadoButton, { backgroundColor: buttonColor, borderColor }]}
                                                            onPress={() => setItems(current => current.map(i => i.id === item.id ? { ...i, estado: normalizedStatus } : i))}
                                                        >
                                                            <Text style={[styles.estadoButtonText, { color: textColor }]}>{status}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>

                                            {(item.estado === 'regular' || item.estado === 'mal') && (
                                                <View>
                                                    <TouchableOpacity onPress={() => handleToggleObservation(item.id)} style={styles.observationButton}>
                                                        <Text style={styles.observationButtonText}>{isObserving ? 'Ocultar' : 'Añadir/Ver Observación'}</Text>
                                                    </TouchableOpacity>
                                                    {isObserving && (
                                                        <View style={styles.observationWrapper}>
                                                            {item.observacion ? (
                                                                <Text style={styles.observationText}>{item.observacion}</Text>
                                                            ) : null}
                                                            <TextInput
                                                                style={styles.textInputObservacion}
                                                                placeholder="Describe el problema..."
                                                                placeholderTextColor={themeColors.textSecondary}
                                                                value={item.observacion}
                                                                onChangeText={(text) => setItems(current => current.map(i => i.id === item.id ? { ...i, observacion: text } : i))}
                                                                multiline
                                                            />
                                                            {item.foto ? (
                                                                <View style={styles.evidencePhotoContainer}>
                                                                    <Image source={{ uri: item.foto.uri }} style={styles.thumbnail} />
                                                                    <TouchableOpacity onPress={() => handleRemovePhotoForItem(item.id)} style={styles.removePhotoButton}>
                                                                        <Text style={styles.removePhotoButtonText}>×</Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            ) : (
                                                                <TouchableOpacity onPress={() => handleTakePhotoForItem(item.id)} style={[styles.addPhotoButton, { marginTop: 10, height: 'auto', paddingVertical: 15 }]}>
                                                                    <Svg width={32} height={32} viewBox="0 0 24 24" stroke={themeColors.primary} strokeWidth={2} fill="none"><Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><Circle cx={12} cy={13} r={4} /></Svg>
                                                                    <Text style={styles.addPhotoButtonText}>Tomar Foto</Text>
                                                                </TouchableOpacity>
                                                            )}
                                                        </View>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        );
    };

    const renderEvidenceStep = () => (
        <ScrollView key="evidence-step" style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepInfoText}>Añade fotos como evidencia para los ítems marcados como &apos;Regular&apos; o &apos;Mal&apos;.</Text>
            {items.filter(item => item.estado === 'regular' || item.estado === 'mal').map(item => (
                <View key={item.id} style={styles.card}>
                    <Text style={styles.itemTitle}>{item.nombre}</Text>
                    {item.foto ? (
                        <View style={styles.thumbnailWrapper}>
                            <Image source={{ uri: item.foto.uri }} style={styles.thumbnail} />
                            <TouchableOpacity onPress={() => handleRemovePhotoForItem(item.id)} style={styles.removePhotoButton}>
                                <Text style={styles.removePhotoButtonText}>×</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={() => handleTakePhotoForItem(item.id)} style={styles.addPhotoButton}>
                            <Svg width={32} height={32} viewBox="0 0 24 24" stroke={themeColors.primary} strokeWidth={2} fill="none"><Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><Circle cx={12} cy={13} r={4} /></Svg>
                            <Text style={styles.addPhotoButtonText}>Tomar Foto de Evidencia</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ))}
        </ScrollView>
    );

    const renderVehiclePhotosStep = () => (
        <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepInfoText}>Toma las 4 fotos reglamentarias del vehículo.</Text>
            <View style={styles.vehiclePhotoGrid}>
                {vehiclePhotoSlots.map(slot => (
                    <View key={slot.key} style={styles.vehiclePhotoSlot}>
                        <Text style={styles.vehiclePhotoLabel}>{slot.label}</Text>
                        {vehiclePhotos[slot.key] ? (
                            <View style={styles.thumbnailWrapper}>
                                <Image source={{ uri: vehiclePhotos[slot.key].uri }} style={styles.thumbnail} />
                                <TouchableOpacity onPress={() => handleRemoveVehiclePhoto(slot.key)} style={styles.removePhotoButton}>
                                    <Text style={styles.removePhotoButtonText}>×</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => handleTakeVehiclePhoto(slot.key)} style={styles.addPhotoButton}>
                                <Svg width={32} height={32} viewBox="0 0 24 24" stroke={themeColors.primary} strokeWidth={2} fill="none"><Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><Circle cx={12} cy={13} r={4} /></Svg>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </View>
            <View style={[styles.card, { marginTop: 20 }]}>
                <Text style={styles.cardTitle}>Foto Adicional (Opcional)</Text>
                {optionalPhoto ? (
                    <View style={styles.thumbnailWrapper}>
                        <Image source={{ uri: optionalPhoto.uri }} style={styles.thumbnail} />
                        <TouchableOpacity onPress={handleRemoveOptionalPhoto} style={styles.removePhotoButton}>
                            <Text style={styles.removePhotoButtonText}>×</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity onPress={handleTakeOptionalPhoto} style={styles.addPhotoButton}>
                        <Svg width={32} height={32} viewBox="0 0 24 24" stroke={themeColors.primary} strokeWidth={2} fill="none"><Path d="M12 5v14m-7-7h14" /></Svg>
                        <Text style={styles.addPhotoButtonText}>Añadir Foto</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );

    const renderSignatureStep = () => (
        <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Firma del Inspector</Text>
                <TouchableOpacity onPress={() => setSignatureModal({ visible: true, type: 'inspector' })} style={styles.signaturePlaceholder}>
                    {inspectorSignature ? (
                        <Image source={{ uri: inspectorSignature }} style={styles.signatureImage} resizeMode="contain" />
                    ) : (
                        <Text style={styles.signaturePlaceholderText}>Tocar para firmar</Text>
                    )}
                </TouchableOpacity>
                {inspectorSignature && <Text style={styles.signatureConfirmation}>✓ Firma Guardada</Text>}
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Firma del Contribuyente (Opcional)</Text>
                <TouchableOpacity onPress={() => setSignatureModal({ visible: true, type: 'contributor' })} style={styles.signaturePlaceholder}>
                    {contributorSignature ? (
                        <Image source={{ uri: contributorSignature }} style={styles.signatureImage} resizeMode="contain" />
                    ) : (
                        <Text style={styles.signaturePlaceholderText}>Tocar para firmar</Text>
                    )}
                </TouchableOpacity>
                {contributorSignature && <Text style={styles.signatureConfirmation}>✓ Firma Guardada</Text>}
            </View>

            {tramite?.titular?.email && (
                <View style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}>
                    <TouchableOpacity onPress={() => setSendEmailCopy(!sendEmailCopy)} style={styles.checkbox}>
                        {sendEmailCopy && <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={themeColors.primary} strokeWidth={3}><Path d="M20 6L9 17l-5-5" /></Svg>}
                    </TouchableOpacity>
                    <Text style={styles.checkboxLabel} onPress={() => setSendEmailCopy(!sendEmailCopy)}>Enviar copia por email al titular</Text>
                </View>
            )}
        </ScrollView>
    );

    const renderStepContent = () => {
        const currentStepName = steps[currentStep - 1];
        switch (currentStepName) {
            case 'Verificación': return renderItemsStep();
            case 'Evidencia': return renderEvidenceStep();
            case 'Fotos Vehículo': return renderVehiclePhotosStep();
            case 'Firmas': return renderSignatureStep();
            default: return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: 'Nueva Inspección', headerStyle: { backgroundColor: themeColors.background }, headerTintColor: themeColors.text }} />
            <Text style={styles.mainTitle}>{`Inspección para ${tramite?.habilitacion?.nro_licencia || 'N/A'}`}</Text>
            <Text style={styles.subtitle}>{tramite?.habilitacion?.tipo_transporte || 'Transporte'}</Text>

            <ProgressBar currentStep={currentStep} steps={steps} colors={themeColors} />

            {renderStepContent()}

            <View style={styles.footerNav}>
                <TouchableOpacity onPress={handlePrevStep} style={[styles.navButton, currentStep === 1 && styles.navButtonDisabled]} disabled={currentStep === 1}>
                    <Text style={styles.navButtonText}>Anterior</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNextStep} style={styles.navButtonPrimary} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color={themeColors.white} /> : <Text style={styles.navButtonPrimaryText}>{currentStep === steps.length ? 'Finalizar' : 'Siguiente'}</Text>}
                </TouchableOpacity>
            </View>

            <Modal visible={signatureModal.visible} animationType="slide">
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>{`Firma del ${signatureModal.type === 'inspector' ? 'Inspector' : 'Contribuyente'}`}</Text>
                    <SignatureScreen
                        ref={signatureModal.type === 'inspector' ? inspectorSignatureRef : contributorSignatureRef}
                        onOK={(sig) => {
                            const signature = ensureDataUriPrefix(sig);
                            if (signatureModal.type === 'inspector') setInspectorSignature(signature);
                            else setContributorSignature(signature);
                            setSignatureModal({ visible: false, type: null });
                        }}
                        onEmpty={() => Alert.alert("Atención", "La firma no puede estar vacía.")}
                        descriptionText="" webStyle={`.m-signature-pad--footer {display: none; margin: 0px;} body,html {height: 100%;}`.replace(/'/g, '&apos;')}
                    />
                    <TouchableOpacity onPress={() => setSignatureModal({ visible: false, type: null })} style={styles.modalCloseButton}>
                        <Text style={styles.modalCloseButtonText}>Cerrar</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const getStyles = (themeColors: any) => StyleSheet.create({
    container: { 
      flex: 1, 
      paddingHorizontal: 15,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
      backgroundColor: themeColors.background,
    },
    mainTitle: { fontSize: 28, fontWeight: 'bold', color: themeColors.text, textAlign: 'center', marginTop: 10 },
    subtitle: { fontSize: 16, color: themeColors.textSecondary, textAlign: 'center', marginBottom: 25 },
    progressContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 25, paddingHorizontal: 10 },
    step: { alignItems: 'center', flex: 1 },
    stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: themeColors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: themeColors.border },
    stepNumber: { color: themeColors.textSecondary, fontWeight: 'bold' },
    stepLabel: { fontSize: 12, color: themeColors.textSecondary, marginTop: 6, textAlign: 'center', fontWeight: '500' },
    stepLine: { flex: 1, height: 2, backgroundColor: themeColors.border, top: 15, marginHorizontal: -15, zIndex: -1 },
    stepContent: { flex: 1 },
    centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    stepInfoText: { fontSize: 16, color: themeColors.textSecondary, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
    footerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderTopColor: themeColors.border, backgroundColor: themeColors.background },
    navButton: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1.5, borderColor: themeColors.textSecondary },
    navButtonDisabled: { opacity: 0.5 },
    navButtonText: { color: themeColors.textSecondary, fontWeight: 'bold', fontSize: 16 },
    navButtonPrimary: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, backgroundColor: themeColors.primary, elevation: 2, shadowColor: themeColors.black, shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    navButtonPrimaryText: { color: themeColors.white, fontWeight: 'bold', fontSize: 16 },
    card: { backgroundColor: themeColors.cardBackground, borderRadius: 12, marginBottom: 15, padding: 15, borderWidth: 1, borderColor: themeColors.border, },
    categoryContainer: { backgroundColor: themeColors.cardBackground, borderRadius: 12, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: themeColors.border, elevation: 1, shadowColor: themeColors.black, shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: {width: 0, height: 1} },
    categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
    categoryTitle: { fontSize: 18, fontWeight: '700', color: themeColors.text },
    itemsList: { paddingTop: 5 },
    itemContainer: { paddingHorizontal: 15, paddingVertical: 20, borderTopWidth: 1, borderTopColor: themeColors.border },
    itemTitle: { fontSize: 16, fontWeight: '600', color: themeColors.text, marginBottom: 15 },
    estadoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    estadoButton: { paddingVertical: 10, borderRadius: 20, flex: 1, marginHorizontal: 4, alignItems: 'center', borderWidth: 1.5, borderColor: themeColors.border },
    estadoButtonText: { fontSize: 14, fontWeight: 'bold' },
    textInputObservacion: { backgroundColor: themeColors.background, borderRadius: 8, padding: 12, height: 70, textAlignVertical: 'top', fontSize: 15, color: themeColors.text, borderWidth: 1, borderColor: themeColors.border },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: themeColors.text, marginBottom: 20 },
    vehiclePhotoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    vehiclePhotoSlot: { width: '48%', marginBottom: 15 },
    vehiclePhotoLabel: { fontSize: 14, fontWeight: '600', color: themeColors.textSecondary, marginBottom: 8, textAlign: 'center' },
    addPhotoButton: { height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.primaryLight, borderRadius: 12, borderWidth: 1, borderColor: themeColors.primaryLight },
    addPhotoButtonText: { color: themeColors.primary, fontWeight: 'bold', marginTop: 8, fontSize: 14 },
    thumbnail: { width: '100%', height: 120, borderRadius: 10 },
    thumbnailWrapper: { position: 'relative', width: '100%', elevation: 3, shadowColor: themeColors.black, shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } },
    removePhotoButton: { position: 'absolute', top: -10, right: -10, backgroundColor: themeColors.error, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    removePhotoButtonText: { color: themeColors.white, fontWeight: 'bold', fontSize: 16, lineHeight: 18 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: themeColors.text, marginBottom: 15 },
    signaturePlaceholder: { height: 150, backgroundColor: themeColors.background, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: themeColors.border, borderStyle: 'dashed' },
    signaturePlaceholderText: { color: themeColors.textSecondary, fontWeight: '600', fontSize: 16 },
    signatureImage: { width: '100%', height: '100%' },
    signatureConfirmation: { color: themeColors.success, fontWeight: 'bold', marginTop: 10, textAlign: 'center', fontSize: 14 },
    modalContainer: { flex: 1, justifyContent: 'center', padding: 15, backgroundColor: themeColors.cardBackground },
    modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: themeColors.text },
    modalCloseButton: { marginTop: 20, padding: 15, alignItems: 'center' },
    modalCloseButtonText: { color: themeColors.primary, fontSize: 16, fontWeight: 'bold' },
    evidencePhotoContainer: { alignItems: 'center', marginTop: 10, },
    optionalPhotoContainer: { alignItems: 'center', justifyContent: 'center' },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
    checkbox: { width: 26, height: 26, borderWidth: 2, borderColor: themeColors.primary, borderRadius: 6, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
    checkboxLabel: { fontSize: 16, color: themeColors.text, flex: 1 },
    observationWrapper: { marginTop: 15, },
    observationText: { fontSize: 15, color: themeColors.textSecondary, backgroundColor: themeColors.background, padding: 12, borderRadius: 8, fontStyle: 'italic', marginBottom: 10, },
    observationButton: { alignSelf: 'flex-start', marginTop: 10, },
    observationButtonText: { color: themeColors.primary, fontWeight: 'bold', fontSize: 15, },
  });

export default InspectionFormScreen;