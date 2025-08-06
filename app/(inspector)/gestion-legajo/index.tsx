import { AppTheme, ThemeContext } from '@/contexts/ThemeContext';
import type { Vehiculo as VehiculoBase } from '@/types/habilitacion';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert,
    Animated,
    FlatList,
    Image, LayoutAnimation,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

// --- Habilitar Animaciones en Android ---
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Hook para acceder fácilmente a los colores del tema
const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context.theme;
};

// ==================================
// --- ESTILOS ---
// ==================================
const getStyles = (colors: AppTheme['colors']) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 40 : 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerBackButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    headerPlaceholder: {
        width: 44,
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 10,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        paddingHorizontal: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: {width: 0, height: 2},
    },
    searchInput: {
        flex: 1,
        height: 50,
        paddingLeft: 10,
        fontSize: 16,
        color: '#FFFFFF',
    },
    qrButton: {
        backgroundColor: colors.cardBackground,
        height: 50,
        width: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: {width: 0, height: 2},
    },
    content: {
        flex: 1,
        paddingHorizontal: Platform.OS === 'android' ? 8 : 15,
    },
    sectionContainer: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginHorizontal: 8,
        marginTop: 15,
        marginBottom: 10,
    },
    sectionContent: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        padding: 15,
        borderWidth: 1,
        borderColor: colors.border,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 5,
        shadowOffset: {width: 0, height: 2},
    },
    formFieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    inputIcon: {
        position: 'absolute',
        left: 12,
        zIndex: 1,
        opacity: 0.6,
    },
    input: {
        height: 50,
        backgroundColor: colors.background,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        fontSize: 16,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: colors.border,
    },
    inputDisabled: {
        height: 50,
        backgroundColor: colors.border,
        color: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderRadius: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: 0.7,
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: colors.cardBackground,
        borderTopWidth: 1,
        borderColor: colors.border,
        gap: 10,
    },
    saveButton: {
        flex: 1,
        backgroundColor: colors.primary,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        flex: 0.8,
        backgroundColor: colors.border,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    backButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    gridItem: {
        flex: 0.5,
        padding: 8,
    },
    card: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        padding: 15,
        height: 160,
        justifyContent: 'space-between',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 4},
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
    },
    emptyText: {
        textAlign: 'center',
        color: '#FFFFFF',
        marginTop: 50,
        fontSize: 16,
    },
    cardSelect: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 8,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: {width: 0, height: 2},
    },
    cardTextContainer: {
        flex: 1,
    },
    profileImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.cardBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    scanButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    scanButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    imageOverlayText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: colors.cardBackground,
        borderRadius: 8,
        padding: 4,
        marginBottom: 20,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: 'center',
    },
    segmentButtonSelected: {
        backgroundColor: colors.primary,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    segmentTextSelected: {
        color: '#FFFFFF',
    },
});

// ==================================
// --- ICONOS ---
// ==================================
type IconProps = { color: string; size?: number };
const ArrowLeftIcon = ({ color, size = 28 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><Path d="M19 12H5M12 19l-7-7 7-7" /></Svg>;
const SearchIcon = ({ color, size = 20 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Circle cx="11" cy="11" r="8" /><Path d="M21 21l-4.35-4.35" /></Svg>;
const CarIcon = ({ color, size = 28 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M14 16.67H9.33a1 1 0 01-1-1V12.33a1 1 0 011-1H14a1 1 0 011 1v3.34a1 1 0 01-1 1z" /><Path d="M10.33 11.33V8.83a2 2 0 012-2h0a2 2 0 012 2v2.5M17.5 16.67h1a1 1 0 001-1V10.83a3 3 0 00-3-3H7.5a3 3 0 00-3 3v4.84a1 1 0 001 1h1m9 0v2m-9-2v2" /></Svg>;
const UserIcon = ({ color, size = 28 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><Circle cx="12" cy="7" r="4" /></Svg>;
const CameraIcon = ({ color, size = 24 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><Circle cx="12" cy="13" r="4" /></Svg>;
const QrcodeIcon = ({ color, size = 24 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="3" width="7" height="7" /><Rect x="14" y="3" width="7" height="7" /><Rect x="14" y="14" width="7" height="7" /><Rect x="3" y="14" width="7" height="7" /></Svg>;
const MailIcon = ({ color, size = 20 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><Polyline points="22,6 12,13 2,6" /></Svg>;
const PhoneIcon = ({ color, size = 20 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></Svg>;
const IdIcon = ({ color, size = 20 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="4" width="18" height="16" rx="2" ry="2" /><Line x1="7" y1="9" x2="17" y2="9" /><Line x1="7" y1="13" x2="17" y2="13" /><Line x1="9" y1="17" x2="15" y2="17" /></Svg>;
const IdCardIcon = ({ color, size = 20 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="4" width="18" height="16" rx="2" ry="2" /><Line x1="7" y1="9" x2="17" y2="9" /><Line x1="7" y1="13" x2="17" y2="13" /><Line x1="9" y1="17" x2="15" y2="17" /></Svg>;
const CalendarIcon = ({ color, size = 20 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="4" width="18" height="16" rx="2" ry="2" /><Line x1="16" y1="2" x2="16" y2="6" /><Line x1="8" y1="2" x2="8" y2="6" /><Line x1="3" y1="10" x2="21" y2="10" /></Svg>;
const ChevronRightIcon = ({ color, size = 22 }: IconProps) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 18l6-6-6-6" /></Svg>;


// ==================================
// --- TIPOS DE DATOS ---
// ==================================
interface Licencia { id: string; nro_licencia: string; titular_principal: string; }
interface Persona { id: number; nombre: string; dni: string; telefono: string; email: string; rol: string; foto_url: string; genero: string; cuit: string; domicilio_calle: string; domicilio_nro: string; domicilio_localidad: string; }
interface Vehiculo extends VehiculoBase {
    chasis?: string;
    tipo?: string;
    foto_url?: string;
    Aseguradora?: string;
    poliza?: string;
}
interface LegajoCompleto { vehiculo: Vehiculo; personas: Persona[]; }

// ==================================
// --- COMPONENTES DE UI MEJORADOS ---
// ==================================
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => {
    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme.colors), [theme]);
    return (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );
};

const FormField = ({ label, children }: { label: string, children: React.ReactNode }) => {
    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme.colors), [theme]);
    return (
        <View style={styles.formFieldContainer}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {children}
        </View>
    );
};

const InputWithIcon = ({ icon, style, ...props }: TextInputProps & { icon: React.ReactNode }) => {
    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme.colors), [theme]);
    return (
        <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>{icon}</View>
            <TextInput
                style={[styles.input, { paddingLeft: 40 }, style]}
                placeholderTextColor={theme.colors.textSecondary}
                {...props}
            />
        </View>
    );
};


// ==================================
// --- PANTALLA PRINCIPAL ---
// ==================================
export default function GestionLegajoScreen() {
    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme.colors), [theme]);
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [todasLasLicencias, setTodasLasLicencias] = useState<Licencia[]>([]);
    const [licenciasFiltradas, setLicenciasFiltradas] = useState<Licencia[]>([]);
    const [selectedLegajo, setSelectedLegajo] = useState<LegajoCompleto | null>(null);
    const [entityToEdit, setEntityToEdit] = useState<Partial<Persona & Vehiculo> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(false);
    const [scannedImage, setScannedImage] = useState<string | null>(null);

    const animateTransition = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        const AnimatedGridItem = ({ item, index, onPress }: { item: Licencia; index: number; onPress: () => void; }) => {
        const theme = useTheme();
        const styles = useMemo(() => getStyles(theme.colors), [theme]);
        const fadeAnim = useRef(new Animated.Value(0)).current;
        useEffect(() => {
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }).start();
        }, [fadeAnim, index]);

        return (
            <Animated.View style={[styles.gridItem, { opacity: fadeAnim }]}>
                <TouchableOpacity onPress={onPress} style={styles.card}>
                                        <View style={styles.cardIconContainer}><UserIcon color={theme.colors.primaryDark} size={24} /></View>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.titular_principal}</Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>{item.nro_licencia}</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const fetchAllLicenses = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://api.transportelanus.com.ar/v2/api_listar_habilitaciones.php`);
            const data = await response.json();
            setTodasLasLicencias(data.licencias || []);
            setLicenciasFiltradas(data.licencias || []);
        } catch { Alert.alert("Error", "No se pudo cargar la lista de habilitaciones."); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => {
        fetchAllLicenses();
    }, [fetchAllLicenses]);

    useEffect(() => {
        if (!searchTerm) {
            setLicenciasFiltradas(todasLasLicencias);
        } else {
            const lowercasedTerm = searchTerm.toLowerCase();
            const filtradas = todasLasLicencias.filter(lic =>
                lic.nro_licencia.toLowerCase().includes(lowercasedTerm) ||
                (lic.titular_principal && lic.titular_principal.toLowerCase().includes(lowercasedTerm))
            );
            setLicenciasFiltradas(filtradas);
        }
    }, [searchTerm, todasLasLicencias]);

    const selectLicencia = async (licencia: Licencia) => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://api.transportelanus.com.ar/v2/api_obtener_detalle_legajo.php?id=${licencia.id}`);
            const data = await response.json();
            if (!data.exito) throw new Error(data.error);
            const legajoRecibido = data.legajo;
            if (!legajoRecibido || (!legajoRecibido.vehiculo && (!legajoRecibido.personas || legajoRecibido.personas.length === 0))) {
                throw new Error("Esta habilitación no tiene un vehículo o personas asociadas para gestionar.");
            }
            animateTransition();
            setSelectedLegajo(legajoRecibido);
            setStep(2);
        } catch (error: any) { Alert.alert("No se puede continuar", error.message); }
        finally { setIsLoading(false); }
    };

    const selectEntityToEdit = (entity: Persona | Vehiculo) => {
        animateTransition();
        setEntityToEdit(JSON.parse(JSON.stringify(entity)));
        setStep(3);
    };

    const handleFieldChange = (field: string, value: string | number) => {
        if (entityToEdit) setEntityToEdit({ ...entityToEdit, [field]: value });
    };

    const handleScanDNI = async () => {
        if (!entityToEdit || !('dni' in entityToEdit)) return;
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (result.canceled) return;

        setIsScanning(true);
        const formData = new FormData();
        formData.append('documento', { uri: result.assets[0].uri, name: 'dni.jpg', type: 'image/jpeg' } as any);

        try {
            const response = await fetch('https://api.transportelanus.com.ar/v2/api_procesar_documento.php', { method: 'POST', body: formData });
            const data = await response.json();
            if (!data.exito || !data.datos.dni) throw new Error(data.error || 'No se pudo leer el DNI de la imagen.');

            if (data.datos.dni !== entityToEdit.dni) {
                Alert.alert("¡Atención!", `El DNI escaneado (${data.datos.dni}) no coincide con el DNI actual (${entityToEdit.dni}). No se actualizarán los datos.`);
            } else {
                Alert.alert("DNI Coincide", "El DNI escaneado es correcto. Se actualizará la foto y el nombre si lo deseas.", [
                    { text: "Cancelar", style: 'cancel' },
                    {
                        text: "Actualizar", onPress: () => {
                            setEntityToEdit(prev => ({
                                ...prev!,
                                nombre: data.datos.nombre || prev!.nombre,
                                foto_url: result.assets[0].uri,
                            }));
                        }
                    }
                ]);
            }
        } catch (e: any) { Alert.alert("Error de OCR", e.message); }
        finally { setIsScanning(false); }
    };

    const pickImageForEntity = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
        if (!result.canceled && entityToEdit) {
            handleFieldChange('foto_url', result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        const formData = new FormData();
        const entityType = 'rol' in entityToEdit! ? 'persona' : 'vehiculo';

        formData.append('type', entityType);
        formData.append('data', JSON.stringify(entityToEdit));

        if (entityToEdit?.foto_url && entityToEdit.foto_url.startsWith('file://')) {
            formData.append('foto', { uri: entityToEdit.foto_url, name: `foto_${entityToEdit.id}.jpg`, type: 'image/jpeg' } as any);
        }

        try {
            const response = await fetch('https://api.transportelanus.com.ar/v2/api_actualizar_entidad.php', { method: 'POST', body: formData });
            const result = await response.json();
            if (!result.exito) throw new Error(result.error);
            Alert.alert("Éxito", "Los datos se han guardado correctamente.", [{
                text: "OK", onPress: () => {
                    animateTransition();
                    setStep(1);
                    setSearchTerm('');
                    fetchAllLicenses();
                }
            }]);
        } catch (error: any) { Alert.alert("Error al guardar", error.message); }
        finally { setIsLoading(false); }
    };

    const goBack = () => {
        animateTransition();
        if (step > 1) {
            setStep(step - 1);
        } else {
            router.back();
        }
    };

    const handleImagePicker = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                setScannedImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
        }
    };

    const updateEntityField = (field: string, value: string | number) => {
        if (entityToEdit) {
            setEntityToEdit({ ...entityToEdit, [field]: value });
        }
    };

    const renderStepContent = () => {
                if (isLoading && step === 1 && todasLasLicencias.length === 0) {
            return <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />;
        }

        switch (step) {
            case 1:
                return (
                    <FlatList
                        data={licenciasFiltradas}
                        numColumns={2}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingTop: 10 }}
                        ListEmptyComponent={() => <Text style={styles.emptyText}>{searchTerm ? 'No se encontraron resultados.' : 'No hay habilitaciones.'}</Text>}
                        renderItem={({ item, index }) => (
                            <AnimatedGridItem item={item} index={index} onPress={() => selectLicencia(item)} />
                        )}
                    />
                );
            case 2:
                return (
                    <ScrollView contentContainerStyle={{paddingTop: 10}}>
                        {selectedLegajo?.vehiculo && (
                            <TouchableOpacity style={styles.cardSelect} onPress={() => selectEntityToEdit(selectedLegajo.vehiculo)}>
                                <CarIcon color={theme.colors.primaryDark} />
                                <View style={styles.cardTextContainer}>
                                    <Text style={styles.cardTitle}>Vehículo</Text>
                                    <Text style={styles.cardSubtitle}>{selectedLegajo.vehiculo.marca} {selectedLegajo.vehiculo.modelo}</Text>
                                </View>
                                <ChevronRightIcon color={theme.colors.textSecondary}/>
                            </TouchableOpacity>
                        )}
                        {selectedLegajo?.personas.map(p => (
                            <TouchableOpacity key={p.id} style={styles.cardSelect} onPress={() => selectEntityToEdit(p)}>
                                <UserIcon color={theme.colors.primaryDark} />
                                <View style={styles.cardTextContainer}>
                                    <Text style={styles.cardTitle}>{p.rol}</Text>
                                    <Text style={styles.cardSubtitle}>{p.nombre}</Text>
                                </View>
                                <ChevronRightIcon color={theme.colors.textSecondary}/>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                );
            case 3:
                const isPerson = 'rol' in entityToEdit!;
                return (
                    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                        {isPerson ? (
                            <>
                                <View style={styles.profileImageContainer}>
                                    <Image source={{ uri: entityToEdit?.foto_url || undefined }} style={styles.profileImage} />
                                </View>
                                <TouchableOpacity style={styles.scanButton} onPress={handleScanDNI} disabled={isScanning}>
                                    {isScanning ? <ActivityIndicator color="#FFFFFF" /> : (<>
                                        <CameraIcon color="#FFFFFF" size={24} />
                                        <Text style={styles.scanButtonText}>Escanear Nuevo DNI</Text>
                                    </>)}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity onPress={pickImageForEntity} style={styles.imageContainer}>
                                <Image source={{ uri: entityToEdit?.foto_url || undefined }} style={styles.previewImage} />
                                <View style={styles.imageOverlay}><CameraIcon color="#FFFFFF" /><Text style={styles.imageOverlayText}>Cambiar Foto del Vehículo</Text></View>
                            </TouchableOpacity>
                        )}

                        {isPerson ? (
                            <>
                                <Section title="Datos Personales">
                                    <FormField label="Nombre y Apellido">
                                        <InputWithIcon icon={<UserIcon color={theme.colors.textSecondary} size={20} />} value={entityToEdit.nombre} editable={false} style={styles.inputDisabled} />
                                    </FormField>
                                    <FormField label="Documento Nacional de Identidad">
                                        <InputWithIcon icon={<IdIcon color={theme.colors.textSecondary} />} value={entityToEdit.dni} editable={false} style={styles.inputDisabled} />
                                    </FormField>
                                    <FormField label="N° de CUIT">
                                        <TextInput style={styles.input} placeholder="Ingrese el CUIT" value={entityToEdit.cuit} onChangeText={v => handleFieldChange('cuit', v)} keyboardType="numeric" />
                                    </FormField>
                                    <FormField label="Género">
                                        <View style={styles.segmentContainer}>
                                            <TouchableOpacity onPress={() => handleFieldChange('genero', 'Masculino')} style={[styles.segmentButton, entityToEdit.genero === 'Masculino' && styles.segmentButtonSelected]}><Text style={[styles.segmentText, entityToEdit.genero === 'Masculino' && styles.segmentTextSelected]}>Masculino</Text></TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleFieldChange('genero', 'Femenino')} style={[styles.segmentButton, entityToEdit.genero === 'Femenino' && styles.segmentButtonSelected]}><Text style={[styles.segmentText, entityToEdit.genero === 'Femenino' && styles.segmentTextSelected]}>Femenino</Text></TouchableOpacity>
                                    </View>
                                </FormField>
                            </Section>
                            
                            <Section title="Información de Contacto">
                                <FormField label="Teléfono">
                                    <InputWithIcon icon={<PhoneIcon color={theme.colors.textSecondary} />} placeholder="Ej: 1122334455" value={entityToEdit.telefono} onChangeText={v => handleFieldChange('telefono', v)} keyboardType="phone-pad" />
                                </FormField>
                                <FormField label="Correo Electrónico">
                                    <InputWithIcon icon={<MailIcon color={theme.colors.textSecondary} />} placeholder="ejemplo@email.com" value={entityToEdit.email} onChangeText={v => handleFieldChange('email', v)} keyboardType="email-address" autoCapitalize="none" />
                                </FormField>
                            </Section>

                            <Section title="Domicilio">
                                <FormField label="Calle"><TextInput style={styles.input} placeholder="Ingrese la calle" value={entityToEdit.domicilio_calle} onChangeText={v => handleFieldChange('domicilio_calle', v)} /></FormField>
                                <FormField label="Número"><TextInput style={styles.input} placeholder="Ingrese el número" value={entityToEdit.domicilio_nro} onChangeText={v => handleFieldChange('domicilio_nro', v)} /></FormField>
                                <FormField label="Localidad"><TextInput style={styles.input} placeholder="Ingrese la localidad" value={entityToEdit.domicilio_localidad} onChangeText={v => handleFieldChange('domicilio_localidad', v)} /></FormField>
                            </Section>
                        </>
                    ) : (
                        <>
                            <Section title="Datos del Vehículo">
                                <FormField label="Marca"><TextInput style={styles.input} value={entityToEdit!.marca} onChangeText={v => handleFieldChange('marca', v)} /></FormField>
                                <FormField label="Modelo"><TextInput style={styles.input} value={entityToEdit!.modelo} onChangeText={v => handleFieldChange('modelo', v)} /></FormField>
                                <FormField label="Tipo"><TextInput style={styles.input} value={entityToEdit!.tipo} onChangeText={v => handleFieldChange('tipo', v)} /></FormField>
                                <FormField label="Año"><TextInput style={styles.input} value={String(entityToEdit!.ano)} onChangeText={v => handleFieldChange('ano', Number(v))} keyboardType="numeric" /></FormField>
                                <FormField label="Chasis"><TextInput style={styles.input} value={entityToEdit!.chasis} onChangeText={v => handleFieldChange('chasis', v)} /></FormField>
                                <FormField label="Motor"><TextInput style={styles.input} value={entityToEdit!.motor} onChangeText={v => handleFieldChange('motor', v)} /></FormField>
                                <FormField label="Asientos"><TextInput style={styles.input} value={String(entityToEdit!.asientos)} onChangeText={v => handleFieldChange('asientos', Number(v))} keyboardType="numeric" /></FormField>
                            </Section>
                            
                            <Section title="Documentación">
                                <FormField label="Fecha de Inscripción"><TextInput style={styles.input} placeholder="AAAA-MM-DD" value={entityToEdit!.inscripcion_inicial} onChangeText={v => handleFieldChange('inscripcion_inicial', v)} /></FormField>
                                <FormField label="Aseguradora"><TextInput style={styles.input} value={entityToEdit!.Aseguradora} onChangeText={v => handleFieldChange('Aseguradora', v)} /></FormField>
                                <FormField label="N° de Póliza"><TextInput style={styles.input} value={entityToEdit!.poliza} onChangeText={v => handleFieldChange('poliza', v)} /></FormField>
                                <FormField label="Vencimiento Póliza"><TextInput style={styles.input} placeholder="AAAA-MM-DD" value={entityToEdit!.Vencimiento_Poliza} onChangeText={v => handleFieldChange('Vencimiento_Poliza', v)} /></FormField>
                                <FormField label="Vencimiento VTV"><TextInput style={styles.input} placeholder="AAAA-MM-DD" value={entityToEdit!.Vencimiento_VTV} onChangeText={v => handleFieldChange('Vencimiento_VTV', v)} /></FormField>
                            </Section>
                        </>
                    )}
                </ScrollView>
            );
        default: return null;
    }
};



return (
    <SafeAreaView style={styles.container}>
        <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.headerBackButton}><ArrowLeftIcon color="#FFFFFF" /></TouchableOpacity>
            <Text style={styles.headerTitle}>{step === 1 ? 'Buscar Habilitación' : (step === 2 ? 'Gestionar Legajo' : 'Editar Datos')}</Text>
            <View style={styles.headerPlaceholder} />
        </LinearGradient>

        {step === 1 && (
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <SearchIcon color={theme.colors.textSecondary} />
                    <TextInput style={styles.searchInput} placeholder="Filtrar por Licencia o Titular..." value={searchTerm} onChangeText={setSearchTerm} placeholderTextColor={theme.colors.textSecondary}/>
                </View>
                <TouchableOpacity style={styles.qrButton} onPress={() => Alert.alert("Próximamente", "La función de escaneo QR estará disponible pronto.")}>
                    <QrcodeIcon color={theme.colors.primaryDark} />
                </TouchableOpacity>
            </View>
        )}

        <View style={styles.content}>
            {isLoading && (step === 2 || step === 3) ? <ActivityIndicator size="large" color={theme.colors.primary} style={{flex: 1}}/> : renderStepContent()}
        </View>

        {step > 1 && (
            <View style={styles.footer}>
                <TouchableOpacity style={styles.backButton} onPress={goBack}><Text style={styles.backButtonText}>Atrás</Text></TouchableOpacity>
                {step === 3 && (
                    <TouchableOpacity style={[styles.saveButton, isLoading && { backgroundColor: theme.colors.textSecondary }]} onPress={handleSave} disabled={isLoading}>
                        <Text style={styles.saveButtonText}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</Text>
                    </TouchableOpacity>
                )}
            </View>
        )}
    </SafeAreaView>
);

};
