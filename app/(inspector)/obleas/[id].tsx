import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

// --- Tipos de Datos ---
interface HabilitacionDetalle {
    id: string;
    nro_licencia: string;
    titular_principal: string;
    vehiculos: { dominio: string; modelo: string }[];
    estado: string;
    vigencia_fin: string;
}

// --- Iconos ---
const InfoIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="10" /><Line x1="12" y1="16" x2="12" y2="12" /><Line x1="12" y1="8" x2="12.01" y2="8" /></Svg>;
const UserIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" /></Svg>;
const CalendarIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><Line x1="16" y1="2" x2="16" y2="6" /><Line x1="8" y1="2" x2="8" y2="6" /><Line x1="3" y1="10" x2="21" y2="10" /></Svg>;
const CheckIcon = () => <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><Path d="M20 6L9 17l-5-5" /></Svg>;
const CameraIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></Path><Circle cx="12" cy="13" r="4"></Circle></Svg>;
const SignatureIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></Path></Svg>;

// --- Configuración de API ---
const API_BASE_URL = 'https://api.transportelanus.com.ar/v2';

// --- Componente Modal de Firma en Pantalla Completa ---
const SignatureModal = ({ visible, onSave, onClose, title }: { visible: boolean, onSave: (sig: string) => void, onClose: () => void, title: string }) => {
    const styles = getStyles();

    const signatureWebStyle = `
        body, html { 
            width: 100%; 
            height: 100%; 
            margin: 0; 
            padding: 0; 
            overflow: hidden;
        }
        .m-signature-pad { 
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            display: flex; 
            flex-direction: column;
            background-color: #FFF;
        }
        .m-signature-pad--body { 
            flex-grow: 1;
            border: 2px dashed #CBD5E1; 
            border-radius: 12px; 
            margin: 10px; 
        }
        .m-signature-pad--footer { 
            height: 80px;
            flex-shrink: 0;
            display: flex; 
            align-items: center; 
            justify-content: space-evenly;
            padding: 0 20px;
            border-top: 1px solid #F1F5F9;
        }
        .button { 
            -webkit-appearance: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            font-weight: 600; 
            font-size: 16px; 
            color: #FFF; 
            padding: 14px 28px; 
            border-radius: 12px; 
            border: none; 
            cursor: pointer;
        }
        .button.clear { 
            background-color: #64748B; 
        }
        .button.save {
            background-color: #3B82F6;
        }
        canvas {
            position: absolute;
            left: 0; top: 0;
            width: 100%; height: 100%;
        }
    `;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" supportedOrientations={['portrait']}>
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                        <Text style={styles.modalCloseButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, width: '100%' }}>
                    <SignatureScreen
                        onOK={onSave}
                        descriptionText=""
                        clearText="Limpiar"
                        confirmText="Guardar Firma"
                        webStyle={signatureWebStyle}
                        backgroundColor="#FFFFFF"
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
};


export default function DetalleObleaScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const styles = getStyles();

    const [habilitacion, setHabilitacion] = useState<HabilitacionDetalle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('Finalizar y Guardar Registro');
    const [error, setError] = useState<string | null>(null);

    const [isSignatureModalVisible, setIsSignatureModalVisible] = useState(false);
    const [currentSignatureType, setCurrentSignatureType] = useState<'receptor' | 'inspector' | null>(null);

    const [foto, setFoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [firmaReceptor, setFirmaReceptor] = useState<string | null>(null);
    const [firmaInspector, setFirmaInspector] = useState<string | null>(null);

    const fetchHabilitacionDetalle = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/obleaslista.php?endpoint=habilitacion/${id}`);
            if (!response.ok) throw new Error('No se encontraron los datos de la habilitación.');
            const data = await response.json();
            setHabilitacion(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchHabilitacionDetalle();
    }, [fetchHabilitacionDetalle]);

    const handleTomarFoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permiso Requerido", "Se necesita acceso a la cámara para tomar la foto de evidencia.");
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
        if (!result.canceled) setFoto(result.assets[0]);
    };

    // ✅ Lógica de Firma SIN rotación
    const openSignatureModal = (type: 'receptor' | 'inspector') => {
        setCurrentSignatureType(type);
        setIsSignatureModalVisible(true);
    };

    const handleSaveSignature = (signature: string) => {
        if (currentSignatureType === 'receptor') {
            setFirmaReceptor(signature);
        } else if (currentSignatureType === 'inspector') {
            setFirmaInspector(signature);
        }
        closeSignatureModal();
    };

    const closeSignatureModal = () => {
        setIsSignatureModalVisible(false);
    };

    const handleConfirmar = async () => {
        if (!foto || !firmaReceptor || !firmaInspector) {
            Alert.alert("Datos Incompletos", "Se requiere la foto de evidencia y ambas firmas para continuar.");
            return;
        }
        setIsSubmitting(true);

        setSubmitMessage('Guardando registro...');
        const formData = new FormData();
        formData.append('habilitacion_id', id as string);
        formData.append('titular', habilitacion?.titular_principal ?? 'N/A');
        formData.append('nro_licencia', habilitacion?.nro_licencia ?? 'N/A');
        formData.append('firma_receptor', firmaReceptor);
        formData.append('firma_inspector', firmaInspector);

        const uriParts = foto.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('foto_evidencia', {
            uri: foto.uri,
            name: `evidencia_${id}.${fileType}`,
            type: `image/${fileType}`,
        } as any);

        try {
            const responseRegistro = await fetch(`${API_BASE_URL}/obleaslista.php?endpoint=registrar-colocacion`, {
                method: 'POST',
                body: formData,
            });
            if (!responseRegistro.ok) {
                const errorText = await responseRegistro.text();
                throw new Error(`El servidor no pudo registrar la colocación. ${errorText}`);
            }

            setSubmitMessage('Enviando correos...');
            const responseCorreo = await fetch(`${API_BASE_URL}/obleaslista.php?endpoint=enviar-certificado`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ habilitacion_id: id }),
            });
            if (!responseCorreo.ok) throw new Error("El registro se guardó, pero no se pudo enviar el correo.");

            Alert.alert("Proceso Completo", "El registro se guardó y el certificado fue enviado por correo.", [
                { text: "Finalizar", onPress: () => router.back() }
            ]);

        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setIsSubmitting(false);
            setSubmitMessage('Finalizar y Guardar Registro');
        }
    };

    if (isLoading) return <ActivityIndicator style={{ flex: 1, backgroundColor: '#F4F7FC' }} size="large" color="#0EA5E9" />;
    if (error) return <View style={styles.centeredMessage}><Text style={styles.errorText}>{error}</Text></View>;

    return (
        <SafeAreaView style={styles.mainContainer}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.headerTitle}>Registrar Colocación</Text>

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}><InfoIcon /><Text style={styles.infoText}>Licencia: {habilitacion?.nro_licencia}</Text></View>
                    <View style={styles.infoRow}><UserIcon /><Text style={styles.infoText}>Titular: {habilitacion?.titular_principal}</Text></View>
                    <View style={styles.infoRow}><CalendarIcon /><Text style={styles.infoText}>Vence: {new Date(habilitacion?.vigencia_fin ?? '').toLocaleDateString('es-AR')}</Text></View>
                </View>

                <Text style={styles.sectionLabel}>1. Evidencia Fotográfica</Text>
                <TouchableOpacity style={styles.photoButton} onPress={handleTomarFoto}>
                    <CameraIcon />
                    <Text style={styles.photoButtonText}>Tomar Foto de Evidencia</Text>
                </TouchableOpacity>
                {foto && (
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: foto.uri }} style={styles.imagePreview} />
                        <View style={styles.imageOverlay}><CheckIcon /></View>
                    </View>
                )}

                <Text style={styles.sectionLabel}>2. Firmas de Conformidad</Text>

                <View style={styles.signatureContainer}>
                    <Text style={styles.signatureLabel}>Firma del Receptor</Text>
                    {firmaReceptor ? (
                        <View style={styles.signaturePreviewBox}>
                            <Image source={{ uri: firmaReceptor }} style={styles.signaturePreview} />
                            <TouchableOpacity onPress={() => openSignatureModal('receptor')} style={styles.changeSignatureButton}>
                                <Text style={styles.changeSignatureButtonText}>Cambiar Firma</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.addSignatureButton} onPress={() => openSignatureModal('receptor')}>
                            <SignatureIcon />
                            <Text style={styles.addSignatureButtonText}>Añadir Firma</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.signatureContainer}>
                    <Text style={styles.signatureLabel}>Firma del Inspector</Text>
                    {firmaInspector ? (
                        <View style={styles.signaturePreviewBox}>
                            <Image source={{ uri: firmaInspector }} style={styles.signaturePreview} />
                            <TouchableOpacity onPress={() => openSignatureModal('inspector')} style={styles.changeSignatureButton}>
                                <Text style={styles.changeSignatureButtonText}>Cambiar Firma</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.addSignatureButton} onPress={() => openSignatureModal('inspector')}>
                            <SignatureIcon />
                            <Text style={styles.addSignatureButtonText}>Añadir Firma</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, (isSubmitting || !foto || !firmaReceptor || !firmaInspector) && styles.submitButtonDisabled]}
                    onPress={handleConfirmar}
                    disabled={isSubmitting || !foto || !firmaReceptor || !firmaInspector}
                >
                    <LinearGradient colors={(isSubmitting || !foto || !firmaReceptor || !firmaInspector) ? ['#94A3B8', '#94A3B8'] : ['#16A34A', '#15803D']} style={styles.buttonGradient}>
                        {isSubmitting
                            ? <><ActivityIndicator color="#FFF" /><Text style={styles.submitButtonText}>{submitMessage}</Text></>
                            : <Text style={styles.submitButtonText}>Finalizar y Guardar Registro</Text>
                        }
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>

            <SignatureModal
                visible={isSignatureModalVisible}
                onSave={handleSaveSignature}
                onClose={closeSignatureModal}
                title={currentSignatureType === 'receptor' ? 'Firma del Receptor' : 'Firma del Inspector'}
            />
        </SafeAreaView>
    );
}

// --- Estilos ---
const getStyles = () => StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#F1F5F9' },
    container: { padding: 20, paddingBottom: 40 },
    centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { color: '#DC2626', fontSize: 16, textAlign: 'center' },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#1E293B', marginBottom: 24 },
    infoCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    infoText: { fontSize: 16, color: '#334155', marginLeft: 12, fontWeight: '500' },

    sectionLabel: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginTop: 16, marginBottom: 16, borderBottomColor: '#CBD5E1', borderBottomWidth: 1, paddingBottom: 8 },

    photoButton: { flexDirection: 'row', backgroundColor: '#3B82F6', padding: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 10 },
    photoButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    imagePreviewContainer: { marginTop: 16, alignItems: 'center', position: 'relative' },
    imagePreview: { width: 150, height: 150, borderRadius: 12, borderWidth: 2, borderColor: '#16A34A' },
    imageOverlay: { position: 'absolute', top: 8, right: 8, backgroundColor: 'white', borderRadius: 16, padding: 4 },

    signatureContainer: { marginBottom: 24 },
    signatureLabel: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 8 },
    signaturePreviewBox: { alignItems: 'center', padding: 8, backgroundColor: '#F0FDF4', borderRadius: 12, borderWidth: 2, borderColor: '#86EFAC' },
    signaturePreview: { width: '100%', height: 100, resizeMode: 'contain' },
    changeSignatureButton: { alignItems: 'center', paddingVertical: 8 },
    changeSignatureButtonText: { color: '#3B82F6', fontWeight: '500' },
    addSignatureButton: { height: 150, justifyContent: 'center', alignItems: 'center', gap: 10, flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E1' },
    addSignatureButtonText: { color: '#334155', fontSize: 16, fontWeight: '600' },

    submitButton: { marginTop: 30, borderRadius: 12, overflow: 'hidden' },
    submitButtonDisabled: { opacity: 0.5 },
    buttonGradient: { padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 12 },
    submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

    modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    modalCloseButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
    },
    modalCloseButtonText: {
        fontSize: 16,
        color: '#334155',
        fontWeight: '600',
    },
});
