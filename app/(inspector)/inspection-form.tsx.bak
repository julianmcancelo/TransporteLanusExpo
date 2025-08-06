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
import { ActivityIndicator, Alert, Image, LayoutAnimation, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import SignatureScreen, { type SignatureViewRef } from 'react-native-signature-canvas';
import { Circle, Path, Svg } from 'react-native-svg';

import { API_GUARDAR_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { createInitialItems, groupItemsByCategory } from './InspectionConfig';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Paleta de colores "Celeste, Blanco y Negro"
const Theme = {
    primary: '#3498db',         // Celeste
    primaryLight: '#eaf5ff',
    text: '#2c3e50',            // Negro/Azul Pizarra Oscuro
    textSecondary: '#8e9eab',    // Gris
    background: '#ecf0f1',      // Gris muy claro
    cardBackground: '#ffffff',  // Blanco
    border: '#dfe6e9',
    success: '#2ecc71',
    error: '#e74c3c',
    warning: '#f39c12',
    black: '#000000',
    white: '#ffffff',
};

// --- Definiciones de Tipos ---
interface UserSession { nombre: string; email: string; rol: 'inspector'; legajo: string; token: string; }
interface AuthContextType { userSession: UserSession | null; setPendingCount: (count: number) => void; }
interface LocationData { latitude: number; longitude: number; timestamp: number | null; }
interface Photo extends ImagePickerAsset { location: LocationData | null; }
interface InspectionItem { id: string; nombre: string; categoria: string; estado: 'bien' | 'regular' | 'mal' | null; observacion: string; foto: Photo | null; }
interface Habilitacion { id: string; nro_licencia: string; tipo_transporte: string; }
interface Titular { nombre: string; dni: string; email?: string; }
import type { Vehiculo } from '../../src/types/habilitacion';
interface Tramite { habilitacion: Habilitacion; titular: Titular | null; vehiculo: Vehiculo | null; }

const QUEUE_KEY = '@inspeccionQueue';
const getPendingInspections = async (): Promise<any[]> => { try { const q = await AsyncStorage.getItem(QUEUE_KEY); return q ? JSON.parse(q) : []; } catch (e) { console.error("Error al obtener la cola:", e); return []; } };
const savePendingInspections = async (queue: any[]) => { try { await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch (e) { console.error("Error al guardar la cola:", e); } };
const toLocationData = (loc: Location.LocationObject | null): LocationData | null => loc ? { latitude: loc.coords.latitude, longitude: loc.coords.longitude, timestamp: loc.timestamp } : null;

// --- Componente de Barra de Progreso ---
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
                            <View style={[styles.stepCircle, (isActive || isCompleted) && { backgroundColor: Theme.primary, borderColor: Theme.primary }]}>
                                {isCompleted ? (
                                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={Theme.white} strokeWidth={3}><Path d="M20 6L9 17l-5-5" /></Svg>
                                ) : (
                                    <Text style={[styles.stepNumber, (isActive || isCompleted) && { color: Theme.white }]}>{stepNumber}</Text>
                                )}
                            </View>
                            <Text style={[styles.stepLabel, isActive && { color: Theme.primary, fontWeight: '700' }]}>{step}</Text>
                        </View>
                        {stepNumber < steps.length && <View style={[styles.stepLine, isCompleted && { backgroundColor: Theme.primary }]} />}
                    </React.Fragment>
                );
            })}
        </View>
    );
};

// --- Componente Principal ---
const InspectionFormScreen = () => {
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
        return <View style={styles.centeredMessage}><ActivityIndicator size="large" color={Theme.primary} /><Text>Cargando sesión...</Text></View>;
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
                const response = await fetch(API_GUARDAR_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); 
                
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
                            <Svg width={20} height={20} viewBox="0 0 24 24" stroke={Theme.primary} strokeWidth={3} fill="none">
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
                                                    const statusColor = estado === 'Bien' ? Theme.success : estado === 'Regular' ? Theme.warning : Theme.error;
                                                    return (
                                                        <TouchableOpacity key={estado} style={[styles.estadoButton, isSelected && { backgroundColor: statusColor }]} onPress={() => setItems(current => current.map(i => i.id === item.id ? { ...i, estado: estadoLower } : i))}>
                                                            <Text style={[styles.estadoButtonText, { color: isSelected ? Theme.white : Theme.textSecondary }]}>{estado}</Text>
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
                                                        placeholderTextColor={Theme.textSecondary}
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
                                    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={Theme.primary} strokeWidth={1.5}>
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
                                    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={Theme.primary} strokeWidth={1.5}>
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
                               <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={Theme.primary} strokeWidth={1.5}><Path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><Circle cx="12" cy="13" r="4" /></Svg>
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
                            <Svg width={18} height={18} viewBox="0 0 24 24" stroke={Theme.primary} strokeWidth={3} fill="none"><Path d="M20 6L9 17l-5-5" /></Svg>
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

    if (!tramite) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}><Text>Error: Datos del trámite no encontrados.</Text></View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: `Inspección: ${tramite.habilitacion.nro_licencia}` }} />
            <View style={styles.container}>
                <Text style={styles.mainTitle}>Formulario de Inspección</Text>
                <Text style={styles.subtitle}>Licencia: {tramite.habilitacion?.nro_licencia || 'N/A'}</Text>
                <ProgressBar currentStep={currentStep} steps={steps} />
                <View style={styles.stepContent}>{renderStepContent()}</View>
                <View style={styles.footerNav}>
                    <TouchableOpacity style={[styles.navButton, currentStep === 1 && styles.navButtonDisabled]} onPress={handlePrevStep} disabled={currentStep === 1} activeOpacity={0.7}><Text style={styles.navButtonText}>Anterior</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.navButtonPrimary} onPress={handleNextStep} disabled={isSubmitting} activeOpacity={0.8}>{isSubmitting && currentStep === steps.length ? <ActivityIndicator color={Theme.white} /> : <Text style={styles.navButtonPrimaryText}>{currentStep === steps.length ? 'Finalizar Inspección' : 'Siguiente'}</Text>}</TouchableOpacity>
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
                        penColor={Theme.text}
                        webStyle={`.m-signature-pad { box-shadow: none; border: none; } .m-signature-pad--body { border: 2px dashed ${Theme.border}; border-radius: 8px; } .m-signature-pad--footer { justify-content: space-around; }`}
                    />
                    <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSignatureModal({ visible: false, type: null })}>
                        <Text style={styles.modalCloseButtonText}>Cerrar sin Guardar</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Theme.background },
    container: { flex: 1, paddingHorizontal: 15 },
    mainTitle: { fontSize: 28, fontWeight: 'bold', color: Theme.text, textAlign: 'center', marginTop: 10 },
    subtitle: { fontSize: 16, color: Theme.textSecondary, textAlign: 'center', marginBottom: 25 },
    progressContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 25, paddingHorizontal: 10 },
    step: { alignItems: 'center', flex: 1 },
    stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Theme.white, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Theme.border },
    stepNumber: { color: Theme.textSecondary, fontWeight: 'bold' },
    stepLabel: { fontSize: 12, color: Theme.textSecondary, marginTop: 6, textAlign: 'center', fontWeight: '500' },
    stepLine: { flex: 1, height: 2, backgroundColor: Theme.border, top: 15, marginHorizontal: -15, zIndex: -1 },
    stepContent: { flex: 1 },
    centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    stepInfoText: { fontSize: 16, color: Theme.textSecondary, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
    footerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderTopColor: Theme.border, backgroundColor: Theme.background },
    navButton: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1.5, borderColor: Theme.textSecondary },
    navButtonDisabled: { opacity: 0.5 },
    navButtonText: { color: Theme.textSecondary, fontWeight: 'bold', fontSize: 16 },
    navButtonPrimary: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, backgroundColor: Theme.primary, elevation: 2, shadowColor: Theme.black, shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    navButtonPrimaryText: { color: Theme.white, fontWeight: 'bold', fontSize: 16 },
    card: { backgroundColor: Theme.cardBackground, borderRadius: 12, marginBottom: 15, padding: 15, borderWidth: 1, borderColor: Theme.border, },
    categoryContainer: { backgroundColor: Theme.cardBackground, borderRadius: 12, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: Theme.border, elevation: 1, shadowColor: Theme.black, shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: {width: 0, height: 1} },
    categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
    categoryTitle: { fontSize: 18, fontWeight: '700', color: Theme.text },
    itemsList: { paddingTop: 5 },
    itemContainer: { paddingHorizontal: 15, paddingVertical: 20, borderTopWidth: 1, borderTopColor: Theme.border },
    itemTitle: { fontSize: 16, fontWeight: '600', color: Theme.text, marginBottom: 15 },
    estadoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    estadoButton: { paddingVertical: 10, borderRadius: 20, flex: 1, marginHorizontal: 4, alignItems: 'center', borderWidth: 1.5, borderColor: Theme.border },
    estadoButtonText: { fontSize: 14, fontWeight: 'bold' },
    textInputObservacion: { backgroundColor: Theme.background, borderRadius: 8, padding: 12, height: 70, textAlignVertical: 'top', fontSize: 15, color: Theme.text, borderWidth: 1, borderColor: Theme.border },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.text, marginBottom: 20 },
    vehiclePhotoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    vehiclePhotoSlot: { width: '48%', marginBottom: 15 },
    vehiclePhotoLabel: { fontSize: 14, fontWeight: '600', color: Theme.textSecondary, marginBottom: 8, textAlign: 'center' },
    addPhotoButton: { height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.primaryLight, borderRadius: 12, borderWidth: 1, borderColor: Theme.primaryLight },
    addPhotoButtonText: { color: Theme.primary, fontWeight: 'bold', marginTop: 8, fontSize: 14 },
    thumbnail: { width: '100%', height: 120, borderRadius: 10 },
    thumbnailWrapper: { position: 'relative', width: '100%', elevation: 3, shadowColor: Theme.black, shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } },
    removePhotoButton: { position: 'absolute', top: -10, right: -10, backgroundColor: Theme.error, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    removePhotoButtonText: { color: Theme.white, fontWeight: 'bold', fontSize: 16, lineHeight: 18 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.text, marginBottom: 15 },
    signaturePlaceholder: { height: 150, backgroundColor: Theme.background, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Theme.border, borderStyle: 'dashed' },
    signaturePlaceholderText: { color: Theme.textSecondary, fontWeight: '600', fontSize: 16 },
    signatureImage: { width: '100%', height: '100%' },
    signatureConfirmation: { color: Theme.success, fontWeight: 'bold', marginTop: 10, textAlign: 'center', fontSize: 14 },
    modalContainer: { flex: 1, justifyContent: 'center', padding: 15, backgroundColor: Theme.cardBackground },
    modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: Theme.text },
    modalCloseButton: { marginTop: 20, padding: 15, alignItems: 'center' },
    modalCloseButtonText: { color: Theme.primary, fontSize: 16, fontWeight: 'bold' },
    evidencePhotoContainer: { alignItems: 'center', marginTop: 10, },
    optionalPhotoContainer: { alignItems: 'center', justifyContent: 'center' },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
    checkbox: { width: 26, height: 26, borderWidth: 2, borderColor: Theme.primary, borderRadius: 6, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
    checkboxLabel: { fontSize: 16, color: Theme.text, flex: 1 },
    observationWrapper: { marginTop: 15, },
    observationText: { fontSize: 15, color: Theme.textSecondary, backgroundColor: Theme.background, padding: 12, borderRadius: 8, fontStyle: 'italic', marginBottom: 10, },
    observationButton: { alignSelf: 'flex-start', marginTop: 10, },
    observationButtonText: { color: Theme.primary, fontWeight: 'bold', fontSize: 15, },
});

export default InspectionFormScreen;