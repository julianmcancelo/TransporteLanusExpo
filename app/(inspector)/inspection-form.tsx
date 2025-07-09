// =================================================================
// ARCHIVO: app/(inspector)/inspection-form.tsx (v6.6 - Adaptado para el Backend)
// Descripción: Corregido y adaptado para funcionar con guardar_inspeccion.php
// =================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import type { ImagePickerAsset } from 'expo-image-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SignatureScreen, { type SignatureViewRef } from 'react-native-signature-canvas';
import { Circle, Path, Svg } from 'react-native-svg';

import { Colors } from '@/constants/Colors';
import AppHeader from '../../src/components/AppHeader';
import { API_GUARDAR_URL } from '../../src/constants/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { createInitialItems, groupItemsByCategory } from './InspectionConfig';

// --- Definiciones de Tipos ---
interface UserSession {
  nombre: string;
  email: string;
  rol: 'inspector';
  legajo: string;
  token: string;
}

interface AuthContextType {
  userSession: UserSession | null;
  setPendingCount: (count: number) => void;
}

interface LocationData { latitude: number; longitude: number; timestamp: number | null; }
interface Photo extends ImagePickerAsset { location: LocationData | null; }
interface InspectionItem { id: string; nombre: string; categoria: string; estado: 'bien' | 'regular' | 'mal' | null; observacion: string; foto: Photo | null; }
interface Habilitacion { id: string; nro_licencia: string; tipo_transporte: string; }
// CORRECCIÓN: Se completan los tipos para que coincidan con los datos reales
interface Titular { nombre: string; dni: string; email?: string; }
interface Vehiculo { dominio: string; marca: string; modelo: string; }
interface Tramite { habilitacion: Habilitacion; titular: Titular | null; vehiculo: Vehiculo | null; }

const QUEUE_KEY = '@inspeccionQueue';
const getPendingInspections = async (): Promise<any[]> => { try { const q = await AsyncStorage.getItem(QUEUE_KEY); return q ? JSON.parse(q) : []; } catch (e) { console.error("Error al obtener la cola:", e); return []; } };
const savePendingInspections = async (queue: any[]) => { try { await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch (e) { console.error("Error al guardar la cola:", e); } };

const toLocationData = (loc: Location.LocationObject | null): LocationData | null => {
  if (!loc) return null;
  return { latitude: loc.coords.latitude, longitude: loc.coords.longitude, timestamp: loc.timestamp };
};

// --- Componente de Barra de Progreso ---
const ProgressBar = ({ currentStep, steps }: { currentStep: number, steps: string[] }) => {
    const themeColors = Colors.light;
    return (
        <View style={styles.progressContainer}>
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;
                return (
                    <React.Fragment key={step}>
                        <View style={styles.step}>
                            <View style={[styles.stepCircle, (isActive || isCompleted) && { borderColor: themeColors.primary, backgroundColor: themeColors.primary }]}>
                                {isCompleted ? (
                                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><Path d="M20 6L9 17l-5-5" /></Svg>
                                ) : (
                                    <Text style={[styles.stepNumber, (isActive || isCompleted) && { color: '#fff' }]}>{stepNumber}</Text>
                                )}
                            </View>
                            <Text style={[styles.stepLabel, isActive && { color: themeColors.primary, fontWeight: 'bold' }]}>{step}</Text>
                        </View>
                        {stepNumber < steps.length && <View style={[styles.stepLine, isCompleted && { backgroundColor: themeColors.primary }]} />}
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
    
    const tramite: Tramite | null = useMemo(() => params.tramite ? JSON.parse(params.tramite as string) : null, [params.tramite]);
    
    const [items, setItems] = useState<InspectionItem[]>(() => createInitialItems(tramite?.habilitacion?.tipo_transporte));
    const [vehiclePhotos, setVehiclePhotos] = useState<{ [key: string]: Photo }>({});
    const [optionalPhoto, setOptionalPhoto] = useState<Photo | null>(null);
    const [inspectorSignature, setInspectorSignature] = useState<string | null>(null);
    const [contributorSignature, setContributorSignature] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [openCategory, setOpenCategory] = useState<string | null>(Object.keys(groupItemsByCategory(items))[0] || null);
    const [signatureModal, setSignatureModal] = useState<{ visible: boolean; type: 'inspector' | 'contributor' | null }>({ visible: false, type: null });
    // ======================= CAMBIO REALIZADO AQUÍ =======================
    const [sendEmailCopy, setSendEmailCopy] = useState(true); // Nuevo estado para el checkbox
    // ===================================================================

    const inspectorSignatureRef = useRef<SignatureViewRef>(null);
    const contributorSignatureRef = useRef<SignatureViewRef>(null);
    const steps = ['Verificación', 'Evidencia', 'Firmas'];

    if (!authContext) {
        router.replace('/login');
        return null;
    }
    
    const { userSession, setPendingCount } = authContext;

    const vehiclePhotoSlots = [
        { key: 'frente', label: 'Frente del Vehículo' },
        { key: 'contrafrente', label: 'Parte Trasera' },
        { key: 'lateral_izq', label: 'Lateral Izquierdo' },
        { key: 'lateral_der', label: 'Lateral Derecho' },
    ];

    const takePictureWithLocation = async (callback: (photo: ImagePicker.ImagePickerAsset, location: Location.LocationObject | null) => void) => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== 'granted') { Alert.alert("Permiso Requerido", "Se necesita acceso a la cámara."); return; }
        
        let location: Location.LocationObject | null = null;
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        if (locationStatus === 'granted') { 
            try { 
                location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }); 
            } catch (err) { 
                console.warn("Advertencia de Ubicación: No se pudo obtener la ubicación.", err); 
            } 
        }
        
        const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
        if (!result.canceled && result.assets) {
            callback(result.assets[0], location);
        }
    };

    const handleNextStep = () => {
        if (currentStep === 1 && items.some(item => !item.estado)) { Alert.alert("Atención", "Califique todos los ítems."); return; }
        if (currentStep < steps.length) { setCurrentStep(currentStep + 1); } else { handleSubmit(); }
    };
    const handlePrevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };
    const handleTakePhotoForItem = (itemId: string) => takePictureWithLocation((photo, location) => setItems(current => current.map(item => item.id === itemId ? { ...item, foto: { ...photo, location: toLocationData(location) } } : item)));
    const handleRemovePhoto = (itemId: string) => setItems(current => current.map(item => item.id === itemId ? { ...item, foto: null } : item));
    const handleTakeVehiclePhoto = (slotKey: string) => takePictureWithLocation((photo, location) => setVehiclePhotos(prev => ({ ...prev, [slotKey]: { ...photo, location: toLocationData(location) } })));
    const handleRemoveVehiclePhoto = (slotKey: string) => setVehiclePhotos(prev => { const newState = { ...prev }; delete newState[slotKey]; return newState; });
    const handleTakeOptionalPhoto = () => takePictureWithLocation((photo, location) => setOptionalPhoto({ ...photo, location: toLocationData(location) }));
    const handleRemoveOptionalPhoto = () => setOptionalPhoto(null);

    const handleSubmit = async () => {
        if (!inspectorSignature) { Alert.alert("Atención", "La firma del inspector es indispensable."); return; }
        setIsSubmitting(true);
        
        // ======================= CAMBIO REALIZADO AQUÍ =======================
        // Se reconstruye el payload para que coincida con lo que espera `guardar_inspeccion.php`
        const payload = {
            // --- Datos que ya se enviaban ---
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

            // --- Datos NUEVOS que faltaban ---
            tipo_transporte: tramite?.habilitacion?.tipo_transporte,
            email_contribuyente: tramite?.titular?.email,
            titular: tramite?.titular, // Objeto completo del titular
            vehiculo: tramite?.vehiculo, // Objeto completo del vehículo
            sendEmailCopy: sendEmailCopy, // El valor del nuevo checkbox

            // --- Ítems (ahora incluyendo el nombre) ---
            items: items.map(item => ({
                id: item.id,
                nombre: item.nombre, // Se añade el nombre del item
                estado: item.estado,
                observacion: item.observacion,
                foto: item.foto?.base64 || null,
                location: item.foto?.location || null
            })),
        };
        // ===================================================================

        const saveLocally = async () => { 
            try { 
                const queue = await getPendingInspections(); 
                queue.push(payload); 
                await savePendingInspections(queue); 
                const newCount = await getPendingInspections(); 
                setPendingCount(newCount.length); 
                Alert.alert("Guardado Localmente", "La inspección se enviará cuando haya conexión."); 
                router.back(); 
            } catch (err) { 
                Alert.alert("Error", `No se pudo guardar la inspección localmente: ${err}`); 
            } 
        };

        if (netInfo.isConnected) { 
            try { 
                const response = await fetch(API_GUARDAR_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); 
                const result = await response.json(); 
                if (response.ok && result.status === 'success') { 
                    Alert.alert("Éxito", result.message || "Inspección guardada correctamente."); 
                    router.back(); 
                } else { 
                    throw new Error(result.message || "Error desconocido del servidor"); 
                } 
            } catch (err: any) { 
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
        return (
            <ScrollView>
                {Object.entries(groupItemsByCategory(items)).map(([categoria, itemsDeCategoria]) => (
                    <View key={categoria} style={styles.categoryContainer}>
                        <TouchableOpacity style={styles.categoryHeader} onPress={() => setOpenCategory(openCategory === categoria ? null : categoria)}>
                            <Text style={styles.categoryTitle}>{categoria}</Text>
                            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.light.primary} strokeWidth={2.5}><Path d={openCategory === categoria ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} /></Svg>
                        </TouchableOpacity>
                        {openCategory === categoria && (
                            <View style={styles.itemsList}>
                                {itemsDeCategoria.map((item: InspectionItem) => (
                                    <View key={item.id} style={styles.itemContainer}>
                                        <Text style={styles.itemTitle}>{item.nombre}</Text>
                                        <View style={styles.estadoContainer}>
                                            {statusOptions.map((estado) => {
                                                const estadoLower = estado.toLowerCase() as 'bien' | 'regular' | 'mal';
                                                return (
                                                    <TouchableOpacity key={estado} style={[styles.estadoButton, { backgroundColor: item.estado === estadoLower ? (estado === 'Bien' ? Colors.light.success : estado === 'Regular' ? Colors.light.warning : Colors.light.error) : Colors.light.grayLight }]} onPress={() => setItems(current => current.map(i => i.id === item.id ? { ...i, estado: estadoLower } : i))}>
                                                        <Text style={[styles.estadoButtonText, { color: item.estado === estadoLower ? '#fff' : Colors.light.text }]}>{estado}</Text>
                                                    </TouchableOpacity>
                                                )
                                            })}
                                        </View>
                                        <TextInput style={styles.textInputObservacion} placeholder="Observación (opcional)..." placeholderTextColor={Colors.light.grayMedium} value={item.observacion} onChangeText={text => setItems(current => current.map(i => i.id === item.id ? { ...i, observacion: text } : i))} multiline />
                                        <View style={styles.itemPhotoContainer}>
                                            <Text style={styles.itemPhotoLabel}>Evidencia (Opcional)</Text>
                                            {item.foto ? (
                                                <View style={styles.thumbnailWrapperSmall}>
                                                    <Image source={{ uri: item.foto.uri }} style={styles.thumbnailSmall} />
                                                    <TouchableOpacity style={styles.removePhotoButtonSmall} onPress={() => handleRemovePhoto(item.id)}>
                                                        <Text style={styles.removePhotoButtonText}>✕</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <TouchableOpacity style={styles.addPhotoButtonSmall} onPress={() => handleTakePhotoForItem(item.id)}>
                                                    <Text style={styles.addPhotoButtonTextSmall}>Añadir Foto</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        );
    }

    const renderPhotosStep = () => (
        <ScrollView contentContainerStyle={{paddingBottom: 20}}>
            <View style={styles.photoSectionContainer}>
                <Text style={styles.sectionTitle}>Fotos del Vehículo</Text>
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
                                <TouchableOpacity style={styles.addPhotoButton} onPress={() => handleTakeVehiclePhoto(slot.key)}>
                                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.light.primary} strokeWidth={2}><Path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><Circle cx="12" cy="13" r="3" /></Svg>
                                    <Text style={styles.addPhotoButtonText}>Tomar Foto</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>
            </View>
            <View style={styles.photoSectionContainer}>
                <Text style={styles.sectionTitle}>Foto Adicional (Opcional)</Text>
                 <View style={styles.optionalPhotoContainer}>
                    {optionalPhoto ? (
                        <View style={styles.thumbnailWrapper}>
                            <Image source={{ uri: optionalPhoto.uri }} style={styles.thumbnail} />
                            <TouchableOpacity style={styles.removePhotoButton} onPress={handleRemoveOptionalPhoto}>
                                <Text style={styles.removePhotoButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.addPhotoButton} onPress={handleTakeOptionalPhoto}>
                            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.light.primary} strokeWidth={2}><Path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><Circle cx="12" cy="13" r="3" /></Svg>
                            <Text style={styles.addPhotoButtonText}>Tomar Foto Adicional</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </ScrollView>
    );

    const renderSignaturesStep = () => (
        <ScrollView contentContainerStyle={{paddingBottom: 20}}>
            <Text style={styles.stepInfoText}>Realice las firmas de conformidad para finalizar el reporte.</Text>
            <View style={styles.signatureCard}>
                <Text style={styles.cardTitle}>Firma de Conformidad del Inspector</Text>
                <TouchableOpacity onPress={() => setSignatureModal({ visible: true, type: 'inspector' })} style={styles.signaturePlaceholder}>
                    {inspectorSignature ? (
                        <Image source={{ uri: inspectorSignature }} style={styles.signatureImage} resizeMode="contain" />
                    ) : (
                        <Text style={styles.signaturePlaceholderText}>Tocar aquí para firmar</Text>
                    )}
                </TouchableOpacity>
                {inspectorSignature && <Text style={styles.signatureConfirmation}>✓ Firma Guardada</Text>}
            </View>
            <View style={styles.signatureCard}>
                <Text style={styles.cardTitle}>Firma del Contribuyente (Opcional)</Text>
                <TouchableOpacity onPress={() => setSignatureModal({ visible: true, type: 'contributor' })} style={styles.signaturePlaceholder}>
                    {contributorSignature ? (
                        <Image source={{ uri: contributorSignature }} style={styles.signatureImage} resizeMode="contain" />
                    ) : (
                        <Text style={styles.signaturePlaceholderText}>Tocar aquí para firmar</Text>
                    )}
                </TouchableOpacity>
                {contributorSignature && <Text style={styles.signatureConfirmation}>✓ Firma Guardada</Text>}
            </View>

            {/* ======================= CAMBIO REALIZADO AQUÍ ======================= */}
            {tramite?.titular?.email && (
              <View style={styles.checkboxContainer}>
                  <TouchableOpacity style={styles.checkbox} onPress={() => setSendEmailCopy(!sendEmailCopy)}>
                      {sendEmailCopy && <View style={styles.checkboxChecked} />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>Enviar copia por email</Text>
              </View>
            )}
            {/* =================================================================== */}

        </ScrollView>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: return renderItemsStep();
            case 2: return renderPhotosStep();
            case 3: return renderSignaturesStep();
            default: return null;
        }
    };

    if (!tramite) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <AppHeader user={userSession} onLogout={() => router.replace('/login')} />
                <View style={styles.container}><Text>Error: Datos del trámite no encontrados.</Text></View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: `Inspección: ${tramite.habilitacion.nro_licencia}` }} />
            <AppHeader user={userSession} onLogout={() => router.replace('/login')} />
            <View style={styles.container}>
                <Text style={styles.mainTitle}>Formulario de Inspección</Text>
                <Text style={styles.subtitle}>Licencia: {tramite.habilitacion?.nro_licencia || 'N/A'}</Text>
                <ProgressBar currentStep={currentStep} steps={steps} />
                <View style={styles.stepContent}>{renderStepContent()}</View>
                <View style={styles.footerNav}>
                    <TouchableOpacity style={[styles.navButton, currentStep === 1 && styles.navButtonDisabled]} onPress={handlePrevStep} disabled={currentStep === 1}><Text style={styles.navButtonText}>Anterior</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.navButton, styles.navButtonPrimary]} onPress={handleNextStep} disabled={isSubmitting}>{isSubmitting && currentStep === steps.length ? <ActivityIndicator color="#fff" /> : <Text style={styles.navButtonPrimaryText}>{currentStep === steps.length ? 'Finalizar' : 'Siguiente'}</Text>}</TouchableOpacity>
                </View>
            </View>
            <Modal visible={signatureModal.visible} onRequestClose={() => setSignatureModal({ visible: false, type: null })}>
                <SafeAreaView style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>{signatureModal.type === 'inspector' ? 'Firma del Inspector' : 'Firma del Contribuyente'}</Text>
                    <SignatureScreen
                        ref={signatureModal.type === 'inspector' ? inspectorSignatureRef : contributorSignatureRef}
                        onOK={(sig: string) => {
                            if (signatureModal.type === 'inspector') setInspectorSignature(sig);
                            else setContributorSignature(sig);
                            setSignatureModal({ visible: false, type: null });
                        }}
                        onEmpty={() => Alert.alert("Atención", "Por favor, realice una firma.")}
                        descriptionText=""
                        clearText="Limpiar"
                        confirmText="Guardar Firma"
                        penColor={Colors.light.text}
                        webStyle={`.m-signature-pad { box-shadow: none; border: none; } .m-signature-pad--body { border: 2px dashed ${Colors.light.grayMedium}; border-radius: 8px; } .m-signature-pad--footer { justify-content: space-around; }`}
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
    safeArea: { flex: 1, backgroundColor: Colors.light.background },
    container: { flex: 1, padding: 15 },
    mainTitle: { fontSize: 26, fontWeight: 'bold', color: Colors.light.text, textAlign: 'center' },
    subtitle: { fontSize: 16, color: Colors.light.grayMedium, textAlign: 'center', marginBottom: 20 },
    progressContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    step: { alignItems: 'center', flex: 1 },
    stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.light.grayLight },
    stepNumber: { color: Colors.light.grayMedium, fontWeight: 'bold' },
    stepLabel: { fontSize: 12, color: Colors.light.grayMedium, marginTop: 5, textAlign: 'center' },
    stepLine: { flex: 1, height: 2, backgroundColor: Colors.light.grayLight, top: 14, marginHorizontal: -10 },
    stepContent: { flex: 1 },
    stepInfoText: { fontSize: 16, color: Colors.light.grayMedium, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
    footerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#e5e5e5' },
    navButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: Colors.light.grayLight },
    navButtonDisabled: { opacity: 0.5 },
    navButtonText: { color: Colors.light.text, fontWeight: 'bold' },
    navButtonPrimary: { backgroundColor: Colors.light.success },
    navButtonPrimaryText: { color: '#fff', fontWeight: 'bold' },
    categoryContainer: { backgroundColor: Colors.light.cardBackground, borderRadius: 8, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
    categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff' },
    categoryTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
    itemsList: { borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    itemContainer: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    itemTitle: { fontSize: 16, color: Colors.light.text, marginBottom: 12 },
    estadoContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
    estadoButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, flex: 1, marginHorizontal: 5, alignItems: 'center' },
    estadoButtonText: { fontSize: 14, fontWeight: 'bold' },
    textInputObservacion: { backgroundColor: Colors.light.grayLight, borderRadius: 8, padding: 10, height: 60, textAlignVertical: 'top', fontSize: 14 },
    photoSectionContainer: { backgroundColor: '#fff', borderRadius: 8, padding: 15, marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text, marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    vehiclePhotoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', },
    vehiclePhotoSlot: { width: '48%', marginBottom: 15, alignItems: 'center', },
    vehiclePhotoLabel: { fontSize: 14, fontWeight: '600', color: Colors.light.grayMedium, marginBottom: 8, },
    addPhotoButton: { width: '100%', height: 100, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.grayLight, borderRadius: 8, borderWidth: 2, borderColor: Colors.light.grayMedium, borderStyle: 'dashed', },
    addPhotoButtonText: { color: Colors.light.primary, fontWeight: 'bold', marginTop: 8 },
    thumbnail: { width: '100%', height: 100, borderRadius: 8 },
    thumbnailWrapper: { position: 'relative', width: '100%' },
    removePhotoButton: { position: 'absolute', top: -10, right: -10, backgroundColor: Colors.light.error, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 2, shadowOffset: {width: 0, height: 2}},
    removePhotoButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, lineHeight: 18 },
    signatureCard: { backgroundColor: '#fff', padding: 20, borderRadius: 8, marginHorizontal: 5, marginBottom: 15 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text, marginBottom: 15 },
    signaturePlaceholder: { height: 120, backgroundColor: Colors.light.grayLight, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.light.grayMedium, borderStyle: 'dashed' },
    signaturePlaceholderText: { color: Colors.light.grayMedium, fontWeight: 'bold' },
    signatureImage: { width: '100%', height: '100%' },
    signatureConfirmation: { color: Colors.light.success, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
    modalContainer: { flex: 1, justifyContent: 'center', padding: 15, backgroundColor: '#fff' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    modalCloseButton: { marginTop: 20, padding: 15, alignItems: 'center' },
    modalCloseButtonText: { color: Colors.light.primary, fontSize: 16, fontWeight: 'bold' },
    itemPhotoContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    itemPhotoLabel: { fontSize: 14, fontWeight: '600', color: Colors.light.grayMedium, marginBottom: 10 },
    thumbnailWrapperSmall: { position: 'relative', width: 100, height: 100 },
    thumbnailSmall: { width: '100%', height: '100%', borderRadius: 8 },
    removePhotoButtonSmall: { position: 'absolute', top: -8, right: -8, backgroundColor: Colors.light.error, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    addPhotoButtonSmall: { paddingVertical: 8, paddingHorizontal: 15, backgroundColor: Colors.light.grayLight, borderRadius: 20, alignSelf: 'flex-start' },
    addPhotoButtonTextSmall: { color: Colors.light.primary, fontWeight: 'bold', fontSize: 14 },
    optionalPhotoContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: '10%' },
    // ======================= CAMBIO REALIZADO AQUÍ =======================
    // Estilos para el nuevo checkbox
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 5,
        marginVertical: 20,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: Colors.light.primary,
        borderRadius: 4,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        width: 14,
        height: 14,
        backgroundColor: Colors.light.primary,
        borderRadius: 2,
    },
    checkboxLabel: {
        fontSize: 16,
        color: Colors.light.text,
    },
    // ===================================================================
});

export default InspectionFormScreen;