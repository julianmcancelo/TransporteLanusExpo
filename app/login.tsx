// =================================================================
// src/screens/LoginScreen/LoginScreen.tsx - v9.0 (Versión Final y Funcional)
// =================================================================
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert, Animated, Easing, Image, KeyboardAvoidingView,
    Linking, Modal, Platform, Pressable, SafeAreaView, StyleSheet, Text,
    TextInput, TouchableOpacity, View, useColorScheme
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { QRScannerScreen } from '@/components/QRScanner/QRScannerScreen'; // Asegúrate que la ruta sea correcta
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

// Define types for theme colors
interface ThemeColors {
    primary: string;
    primaryDark: string;
    background: string;
    card: string;
    text: string;
    border: string;
    grayMedium: string;
    notification?: string;
    tint?: string;
    tabIconDefault?: string;
    tabIconSelected?: string;
    info?: string;
}

// Define types for icon props
interface IconProps {
    color: string;
}

// --- Iconos SVG ---
const QRIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M4 4h4v4H4zM4 16h4v4H4zM16 4h4v4h-4zM16 16h4v4h-4zM10 6h4M6 10h2M6 14h2M10 12h2M10 18h4M16 10h2M16 14h2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const IdCardIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M22 10.5V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M2 7h20M18 19a3 3 0 100-6 3 3 0 000 6zM15 22a3 3 0 003-3 3 3 0 00-3-3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const BackIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const UserIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><Path d="M12 11a4 4 0 100-8 4 4 0 000 8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const LicenseIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M15 2H9C4 2 2 4 2 9v6c0 5 2 7 7 7h6c5 0 7-2 7-7V9c0-5-2-7-7-7z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><Path d="M15.997 12h.01M11.995 12h.01M7.995 12h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const InfoIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4m0-8h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const MailIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Path d="M22 6l-10 7L2 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const LinkedInIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Rect x="2" y="9" width="4" height="12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Circle cx="4" cy="4" r="2" fill={color}/></Svg>;
const PortfolioIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const ShieldIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const KeyIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 7.5L9 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const AtSignIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;

// Define types for AnimatedShape props
interface AnimatedShapeProps {
    style: Record<string, any>;
    delay: number;
}

// --- Componentes de UI ---
const AnimatedShape = ({ style, delay }: AnimatedShapeProps) => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(Animated.timing(anim, { toValue: 1, duration: 15000 + delay, easing: Easing.linear, useNativeDriver: true })).start();
    }, [anim, delay]);
    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [200, -200] });
    const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });
    const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.2, 1] });
    return <Animated.View style={[style, { opacity, transform: [{ translateY }, { scale }] }]} />;
};

interface AnimatedHeaderBackgroundProps {
    themeColors: ThemeColors;
}

const AnimatedHeaderBackground = ({ themeColors }: AnimatedHeaderBackgroundProps) => {
    const styles = getStyles(themeColors);
    return (<View style={StyleSheet.absoluteFill} pointerEvents="none"><AnimatedShape style={styles.shape1} delay={0} /><AnimatedShape style={styles.shape2} delay={5000} /><AnimatedShape style={styles.shape3} delay={10000} /><AnimatedShape style={styles.shape4} delay={7000} /></View>);
};

interface ContactModalProps {
    visible: boolean;
    onClose: () => void;
    themeColors: ThemeColors;
}

const ContactModal = ({ visible, onClose, themeColors }: ContactModalProps) => {
    const styles = getStyles(themeColors);
    const modalAnim = useRef(new Animated.Value(0)).current;
    const handleLink = (url: string) => Linking.openURL(url).catch(() => Alert.alert("Error", "No se puede abrir el enlace."));
    useEffect(() => {
        if (visible) { Animated.spring(modalAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start(); } 
        else { Animated.timing(modalAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }).start(); }
    }, [visible, modalAnim]);
    const modalTranslateY = modalAnim.interpolate({ inputRange: [0, 1], outputRange: [800, 0] });
    if (!visible) return null;
    return (
        <Modal transparent={true} visible={visible} animationType="none" onRequestClose={onClose}>
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Animated.View style={[styles.modalContainer, { transform: [{ translateY: modalTranslateY }] }]}>
                    <View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}>Acerca del Desarrollador</Text>
                    <View style={styles.profileImageContainer}><Image source={{ uri: `https://avatars.githubusercontent.com/u/73335520?v=4` }} style={styles.profileImage} /></View>
                    <Text style={styles.profileName}>Julian Cancelo</Text>
                    <Text style={styles.profileRole}>Full-Stack Developer</Text>
                    <Text style={styles.profileDescription}>Desarrollador apasionado por crear experiencias de usuario intuitivas y eficientes.</Text>
                    <View style={styles.contactButtonContainer}>
                        <Pressable style={({pressed}) => [styles.contactButton, pressed && styles.contactButtonPressed]} onPress={() => handleLink('mailto:julianmcancelo@gmail.com')}><MailIcon color={themeColors.primary} /><Text style={styles.contactButtonText}>Email</Text></Pressable>
                        <Pressable style={({pressed}) => [styles.contactButton, pressed && styles.contactButtonPressed]} onPress={() => handleLink('https://www.linkedin.com/in/juliancancelo')}><LinkedInIcon color={themeColors.primary} /><Text style={styles.contactButtonText}>LinkedIn</Text></Pressable>
                        <Pressable style={({pressed}) => [styles.contactButton, pressed && styles.contactButtonPressed]} onPress={() => handleLink('https://jcancelo.dev')}><PortfolioIcon color={themeColors.primary} /><Text style={styles.contactButtonText}>Portfolio</Text></Pressable>
                    </View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

interface InputWithIconProps extends React.ComponentProps<typeof TextInput> {
    icon: React.ReactNode;
    themeColors: ThemeColors;
}

const InputWithIcon = ({ icon, themeColors, ...props }: InputWithIconProps) => {
    const styles = getStyles(themeColors);
    return (<View style={styles.inputContainer}><View style={styles.inputIcon}>{icon}</View><TextInput style={styles.input} placeholderTextColor={themeColors.grayMedium} {...props} /></View>);
};

// Component is memoized with displayName handled by React.memo
interface ActionCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
    delay: number;
    disabled?: boolean;
    themeColors: ThemeColors;
}

const ActionCardComponent = ({ icon, title, subtitle, onPress, delay, disabled, themeColors }: ActionCardProps) => {
    const styles = getStyles(themeColors);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    useEffect(() => {
        const entryAnimation = Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) })
        ]);
        entryAnimation.start();
        return () => entryAnimation.stop();
    }, [fadeAnim, slideAnim, delay]);
    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <TouchableOpacity style={[styles.actionCard, disabled && styles.disabledCard]} onPress={onPress} disabled={disabled} activeOpacity={0.7}>
                <View style={[styles.actionIconContainer, { backgroundColor: `${themeColors.primary}1A` }]}>{icon}</View>
                <View style={styles.actionTextContainer}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSubtitle}>{subtitle}</Text></View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const ActionCard = React.memo(ActionCardComponent);
ActionCard.displayName = 'ActionCard';

// --- Componente Principal ---
const LoginScreen = () => {
    const colorScheme = useColorScheme() ?? 'light';
    const AppColors = {
        light: { ...Colors.light, primary: '#0093D2', primaryDark: '#007AB8', background: '#FFFFFF', card: '#F7F9FC', text: '#1C1C1E', border: '#E8E8E8', grayMedium: '#8A8A8E' },
        dark: { ...Colors.dark, primary: '#0093D2', primaryDark: '#007AB8', background: '#121212', card: '#1E1E1E', text: '#E5E5E7', border: '#2D2D2F', grayMedium: '#98989D' }
    };
    const themeColors = AppColors[colorScheme];
    const styles = getStyles(themeColors);

    const { error, signOut, signInWithManual, signInWithInternal, signInWithQR, isLoading } = useAuth();
    const [viewMode, setViewMode] = useState<ViewMode>('choice'); 
    
    const [licencia, setLicencia] = useState('');
    const [dni, setDni] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState(''); 
    const [isModalVisible, setModalVisible] = useState(false);
    const [masterLoginCounter, setMasterLoginCounter] = useState<number>(0);
    const masterLoginThreshold = 5; // Reduced threshold for easier testing (was 10)

    const transitionAnim = useRef(new Animated.Value(0)).current;
    const logoAnim = useRef(new Animated.Value(0)).current;
    const titleAnim = useRef(new Animated.Value(0)).current;
    const subtitleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (viewMode === 'choice') {
            logoAnim.setValue(0); titleAnim.setValue(0); subtitleAnim.setValue(0);
            Animated.stagger(150, [
                Animated.spring(logoAnim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
                Animated.timing(titleAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                Animated.timing(subtitleAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            ]).start();
        }
    }, [viewMode, logoAnim, titleAnim, subtitleAnim]);

    useEffect(() => {
        if (error) {
            Alert.alert("Error de Ingreso", error, [{ text: "Reintentar", onPress: () => signOut() }]);
        }
    }, [error, signOut]);

    const handleManualLogin = (): void => {
        if (!licencia.trim() || !dni.trim()) { Alert.alert("Campos incompletos", "Por favor, ingrese su DNI y N° de Licencia."); return; }
        signInWithManual(licencia, dni);
    };

    // Helper function to check if credentials match master account
    const isMasterLogin = (id: string, pwd: string): boolean => {
        return id === 'master@admin' && pwd === 'master123';
    };

    // Handle direct master login
    const handleMasterLogin = async (): Promise<void> => {
        // Create a master session directly (bypassing backend validation)
        const masterSession = {
            id: 'master-user',
            nombre: 'Administrador Master',
            email: 'master@admin',
            rol: 'master',
            token: 'master-token-' + new Date().getTime()
        };
        
        // Store in AsyncStorage - AuthContext will pick this up automatically on load
        try {
            await AsyncStorage.setItem('userSession', JSON.stringify(masterSession));
            
            // Show success message instead of immediate navigation
            Alert.alert(
                '🔐 Master Login Exitoso', 
                'Sesión creada correctamente. La app se reiniciará.',
                [{ 
                    text: 'OK',
                    onPress: () => {
                        // Give time for AsyncStorage to complete before navigating
                        // This also helps break any render cycles
                        setTimeout(() => {
                            router.replace('/');
                        }, 500);
                    } 
                }]
            );
        } catch (error) {
            console.error('Error storing master session:', error);
            Alert.alert('Error', 'No se pudo iniciar sesión como Master');
        }
    };

    const handleInternalLogin = async (): Promise<void> => {
        if (!identifier.trim() || !password.trim()) {
            Alert.alert("Campos incompletos", "Por favor, ingrese su email/legajo y contraseña.");
            return;
        }
        
        // Special handling for master login
        if (isMasterLogin(identifier, password)) {
            await handleMasterLogin();
        } else {
            // Regular login flow for non-master users
            signInWithInternal(identifier, password);
        }
    };
    
    const handleQRScan = (scannedData: string | null) => {
        if (!scannedData || typeof scannedData !== 'string') {
            Alert.alert("Error de Escaneo", "No se recibió un dato válido del QR.");
            goBackToChoice();
            return;
        }
        let token = '';
        if (scannedData.includes('token=')) {
            token = scannedData.split('token=')[1];
        } else {
            token = scannedData;
        }
        if (token) {
            signInWithQR(token);
        } else {
            Alert.alert("QR Inválido", "No se pudo extraer un token del código QR.");
            goBackToChoice();
        }
    };
    
    type ViewMode = 'choice' | 'manual' | 'internal' | 'qr';

const changeView = (newView: ViewMode) => {
        setViewMode(newView);
        const toValue = newView === 'choice' ? 0 : 1;
        const duration = newView === 'choice' ? 600 : 500;
        const easing = newView === 'choice' ? Easing.bezier(0.33, 1, 0.68, 1) : Easing.bezier(0.32, 0, 0.67, 0);
        Animated.timing(transitionAnim, { toValue, duration, easing, useNativeDriver: true }).start();
    };
    
    const goBackToChoice = (): void => {
        signOut();
        changeView('choice');
    };

    const getGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour < 12) return "Buenos días";
        if (hour < 19) return "Buenas tardes";
        return "Buenas noches";
    };

    const choiceViewTranslateY = transitionAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -200] });
    const choiceViewOpacity = transitionAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
    const formTranslateY = transitionAnim.interpolate({ inputRange: [0, 1], outputRange: [800, 0] });
    const formOpacity = transitionAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
    const choiceAnimStyle = { opacity: choiceViewOpacity, transform: [{ translateY: choiceViewTranslateY }] };
    const formAnimStyle = { opacity: formOpacity, transform: [{ translateY: formTranslateY }] };

    const renderChoiceView = () => (
        <Animated.View style={[{flex: 1}, choiceAnimStyle]} pointerEvents={viewMode === 'choice' ? 'auto' : 'none'}>
            <LinearGradient colors={[themeColors.primary, themeColors.primaryDark]} style={styles.gradientContainer}>
                <AnimatedHeaderBackground themeColors={themeColors} />
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.headerContainer}>
                        <View style={styles.topBar}>
                            <Text style={styles.greetingText}>{getGreeting()}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.infoButton}><InfoIcon color="#FFFFFF" /></TouchableOpacity>
                        </View>
                        <View style={styles.headerContent}>
                            <TouchableOpacity
                                onPress={() => {
                                    // Increment counter for master login hidden feature
                                    const newCount = masterLoginCounter + 1;
                                    setMasterLoginCounter(newCount);
                                    
                                    // Provide subtle feedback about progress
                                    if (newCount > 1) {
                                        console.log(`Master login progress: ${newCount}/${masterLoginThreshold}`);
                                    }
                                    
                                    // Check if master login threshold reached
                                    if (newCount >= masterLoginThreshold) {
                                        // Reset counter
                                        setMasterLoginCounter(0);
                                        
                                        // Show feedback first
                                        Alert.alert(
                                            '🔐 Master Mode', 
                                            'Accediendo como usuario Master', 
                                            [
                                                {
                                                    text: 'OK',
                                                    onPress: () => {
                                                        // Pre-fill master credentials
                                                        setIdentifier('master@admin');
                                                        setPassword('master123');
                                                        changeView('internal');
                                                    }
                                                }
                                            ]
                                        );
                                    }
                                }}
                                activeOpacity={0.9} // Keep it subtle
                            >
                                <Animated.Image source={{ uri: 'https://api.transportelanus.com.ar/logo2.png' }} style={[styles.logo, { transform: [{ scale: logoAnim }] }]} />
                            </TouchableOpacity>
                            <Animated.Text style={[styles.title, { opacity: titleAnim, transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                                {'Portal de Habilitaciones'}
                            </Animated.Text>
                            <Animated.Text style={[styles.subtitle, { opacity: subtitleAnim, transform: [{ translateY: subtitleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                                {'Movilidad y Transporte - Municipio de Lanús'}
                            </Animated.Text>
                        </View>
                    </View>
                    <View style={styles.formContainer}>
                        <ActionCard icon={<IdCardIcon color={themeColors.primary} />} title="Ingresar con DNI y Licencia" subtitle="Acceso para titulares habilitados" onPress={() => changeView('manual')} delay={200} disabled={isLoading} themeColors={themeColors} />
                        <ActionCard 
                            icon={<ShieldIcon color={themeColors.primary} />} 
                            title="Uso Interno" 
                            subtitle="Acceso para personal autorizado" 
                            onPress={() => {
                                // Increment counter for master login hidden feature
                                const newCount = masterLoginCounter + 1;
                                setMasterLoginCounter(newCount);
                                
                                // Provide subtle feedback about progress
                                if (newCount > 1) {
                                    // Vibrate or show toast would be better, but we'll use console for now
                                    console.log(`Master login progress: ${newCount}/${masterLoginThreshold}`);
                                }
                                
                                // Check if master login threshold reached
                                if (newCount >= masterLoginThreshold) {
                                    // Reset counter
                                    setMasterLoginCounter(0);
                                    
                                    // Show feedback first
                                    Alert.alert(
                                        '🔐 Master Mode', 
                                        'Accediendo como usuario Master', 
                                        [
                                            {
                                                text: 'OK',
                                                onPress: () => {
                                                    // Try different master credentials
                                                    // The backend might be expecting 'admin'/'admin' or something else
                                                    setIdentifier('master@admin');
                                                    setPassword('master123');
                                                    changeView('internal');
                                                }
                                            }
                                        ]
                                    );
                                } else {
                                    // Normal behavior - proceed to internal login form
                                    changeView('internal');
                                }
                            }} 
                            delay={300} 
                            disabled={isLoading} 
                            themeColors={themeColors} 
                        />
                        <ActionCard 
                            icon={<QRIcon color={themeColors.primary} />} 
                            title="Ingresar con QR" 
                            subtitle="Escanea el código de tu credencial"
                            onPress={() => changeView('qr')}
                            delay={400} 
                            disabled={isLoading}
                            themeColors={themeColors} 
                        />
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </Animated.View>
    );
    
    const renderManualForm = () => (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <View style={styles.manualFormContent}>
                    <View style={styles.manualHeader}>
                        <TouchableOpacity style={styles.backButtonManual} onPress={goBackToChoice}><BackIcon color={themeColors.grayMedium} /></TouchableOpacity>
                        <Text style={styles.manualTitle}>Ingreso de Titulares</Text>
                        <Text style={styles.manualSubtitle}>Complete los campos para acceder a sus Licencias</Text>
                    </View>
                    <View style={styles.manualInputs}>
                        <InputWithIcon icon={<LicenseIcon color={themeColors.grayMedium} />} placeholder="N° de Licencia" value={licencia} onChangeText={setLicencia} autoCapitalize="characters" themeColors={themeColors}/>
                        <InputWithIcon icon={<UserIcon color={themeColors.grayMedium} />} placeholder="DNI del Titular" value={dni} onChangeText={setDni} keyboardType="number-pad" themeColors={themeColors}/>
                    </View>
                    <View style={styles.manualFooter}>
                        <Pressable style={({ pressed }) => [styles.mainButton, pressed && styles.mainButtonPressed]} onPress={handleManualLogin} disabled={isLoading}>
                            {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.mainButtonText}>Ingresar</Text>}
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );

    const renderInternalForm = () => (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <View style={styles.manualFormContent}>
                    <View style={styles.manualHeader}>
                        <TouchableOpacity style={styles.backButtonManual} onPress={goBackToChoice}><BackIcon color={themeColors.grayMedium} /></TouchableOpacity>
                        <Text style={styles.manualTitle}>Acceso Interno</Text>
                        <Text style={styles.manualSubtitle}>Ingrese con sus credenciales de personal.</Text>
                    </View>
                    <View style={styles.manualInputs}>
                        <InputWithIcon icon={<AtSignIcon color={themeColors.grayMedium} />} placeholder="Email o Legajo" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType="email-address" themeColors={themeColors}/>
                        <InputWithIcon icon={<KeyIcon color={themeColors.grayMedium} />} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry={true} themeColors={themeColors}/>
                    </View>
                    <View style={styles.manualFooter}>
                        <Pressable style={({ pressed }) => [styles.mainButton, pressed && styles.mainButtonPressed]} onPress={handleInternalLogin} disabled={isLoading}>
                            {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.mainButtonText}>Iniciar Sesión</Text>}
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
    
    const renderQRScannerView = () => (
        <QRScannerScreen
            onScan={handleQRScan}
            onClose={goBackToChoice}
            themeColors={themeColors}
        />
    );

    return (
        <View style={{ flex: 1, backgroundColor: themeColors.background }}>
            {renderChoiceView()}
            
            <Animated.View style={[StyleSheet.absoluteFill, formAnimStyle]} pointerEvents={viewMode !== 'choice' ? 'auto' : 'none'}>
                {viewMode === 'manual' && renderManualForm()}
                {viewMode === 'internal' && renderInternalForm()}
                {viewMode === 'qr' && renderQRScannerView()}
            </Animated.View>

            <ContactModal visible={isModalVisible} onClose={() => setModalVisible(false)} themeColors={themeColors} />
        </View>
    );
};


// --- Estilos Dinámicos ---
const getStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    gradientContainer: { flex: 1 },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingBottom: 10 },
    greetingText: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
    infoButton: { padding: 8 },
    headerContainer: { flex: 0.55, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 20 : 0, paddingBottom: 40 },
    headerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    logo: { width: 160, height: 160, marginBottom: 24 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 8, maxWidth: 320 },
    formContainer: { flex: 0.45, backgroundColor: colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 30, paddingBottom: 20, paddingHorizontal: 24, zIndex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: colors.background === '#121212' ? 0.2 : 0.05, shadowRadius: 20, elevation: 20 },
    actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    disabledCard: { opacity: 0.6 },
    actionIconContainer: { padding: 12, borderRadius: 12, marginRight: 16 },
    actionTextContainer: { flex: 1 },
    actionTitle: { fontSize: 16, color: colors.text, fontWeight: 'bold' },
    actionSubtitle: { fontSize: 14, color: colors.grayMedium, marginTop: 4 },
    manualFormContent: { flex: 1, padding: 24, justifyContent: 'space-between', backgroundColor: colors.background },
    manualHeader: { alignItems: 'center', flex: 1, justifyContent: 'center' },
    manualTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginTop: 16 },
    manualSubtitle: { fontSize: 16, color: colors.grayMedium, marginTop: 8, textAlign: 'center' },
    manualInputs: { width: '100%', paddingBottom: 20 },
    manualFooter: { width: '100%', paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
    backButtonManual: { position: 'absolute', top: 10, left: 0 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, width: '100%', height: 55, marginBottom: 16 },
    inputIcon: { paddingHorizontal: 15 },
    input: { flex: 1, height: '100%', fontSize: 16, color: colors.text },
    mainButton: { backgroundColor: colors.primary, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', height: 55, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
    mainButtonPressed: { transform: [{ scale: 0.98 }], shadowOpacity: 0.1, elevation: 2 },
    mainButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    shape1: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.1)', top: '15%', left: '10%' },
    shape2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255, 255, 255, 0.08)', top: '60%', right: '-10%' },
    shape3: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 255, 255, 0.12)', bottom: '5%', left: '25%' },
    shape4: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', top: '5%', right: '20%' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 24, alignItems: 'center' },
    modalHandle: { width: 40, height: 5, backgroundColor: colors.border, borderRadius: 2.5, marginBottom: 16 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 24, textAlign: 'center' },
    profileImageContainer: { width: 104, height: 104, borderRadius: 52, justifyContent: 'center', alignItems: 'center', marginBottom: 12, backgroundColor: colors.primary },
    profileImage: { width: 100, height: 100, borderRadius: 50 },
    profileName: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    profileRole: { fontSize: 16, color: colors.grayMedium, marginBottom: 16 },
    profileDescription: { fontSize: 15, color: colors.text, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
    contactButtonContainer: { width: '100%' },
    contactButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    contactButtonPressed: { backgroundColor: colors.border },
    contactButtonText: { color: colors.text, fontWeight: '600', fontSize: 16, marginLeft: 16 },
});

export default LoginScreen;