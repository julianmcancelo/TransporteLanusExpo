// app/(auth)/login.tsx

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Image, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

// --- Tipos para los Props de Componentes ---
type IconProps = { color: string };
type ActionCardProps = {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
    delay: number;
    disabled: boolean;
    themeColors: any;
};

// --- Íconos (Componentes Funcionales de React) ---
const IdCardIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M22 10.5V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M2 7h20M18 19a3 3 0 100-6 3 3 0 000 6zM15 22a3 3 0 003-3 3 3 0 00-3-3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const BackIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const UserIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><Path d="M12 11a4 4 0 100-8 4 4 0 000 8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const LicenseIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M15 2H9C4 2 2 4 2 9v6c0 5 2 7 7 7h6c5 0 7-2 7-7V9c0-5-2-7-7-7z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><Path d="M15.997 12h.01M11.995 12h.01M7.995 12h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const InfoIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4m0-8h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
const ShieldIcon = ({ color }: IconProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const KeyIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 7.5L9 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const AtSignIcon = ({ color }: IconProps) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;

// --- Componentes de UI ---
const AnimatedShape = ({ style, delay }: {style: any, delay: number}) => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(Animated.timing(anim, { toValue: 1, duration: 15000 + delay, easing: Easing.linear, useNativeDriver: true })).start();
    }, []);
    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [200, -200] });
    const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });
    const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.2, 1] });
    return <Animated.View style={[style, { opacity, transform: [{ translateY }, { scale }] }]} />;
};

const AnimatedHeaderBackground = ({ themeColors }: { themeColors: any }) => {
    const styles = getStyles(themeColors);
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <AnimatedShape style={styles.shape1} delay={0} />
            <AnimatedShape style={styles.shape2} delay={5000} />
            <AnimatedShape style={styles.shape3} delay={10000} />
            <AnimatedShape style={styles.shape4} delay={7000} />
        </View>
    );
};

const ActionCard = ({ icon, title, subtitle, onPress, delay, disabled, themeColors }: ActionCardProps) => {
    const styles = getStyles(themeColors);
    return (
        <TouchableOpacity style={[styles.actionCard, disabled && { opacity: 0.6 }]} onPress={onPress} disabled={disabled}>
            <View style={[styles.actionIconContainer, { backgroundColor: `${themeColors.primary}1A` }]}>{icon}</View>
            <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>{title}</Text>
                <Text style={styles.actionSubtitle}>{subtitle}</Text>
            </View>
        </TouchableOpacity>
    );
};

// --- Componente Principal ---
export default function LoginScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const { error, signInWithManual, signInWithInternal, isLoading, signOut } = useAuth();

    const AppColors = {
        light: { ...Colors.light, primary: '#0093D2', primaryDark: '#007AB8', background: '#FFFFFF', card: '#F7F9FC', text: '#1C1C1E', border: '#E8E8E8', grayMedium: '#8A8A8E' },
        dark: { ...Colors.dark, primary: '#0093D2', primaryDark: '#007AB8', background: '#121212', card: '#1E1E1E', text: '#E5E5E7', border: '#2D2D2F', grayMedium: '#98989D' }
    };
    const themeColors = AppColors[colorScheme];
    const styles = getStyles(themeColors);

    const [viewMode, setViewMode] = useState<'choice' | 'manual' | 'internal'>('choice');
    const [licencia, setLicencia] = useState('');
    const [dni, setDni] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');

    const transitionAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (error && !isLoading) {
            Alert.alert("Error de Ingreso", error, [{ text: "Reintentar", onPress: () => signOut() }]);
        }
    }, [error, isLoading]);

    const handleManualLogin = () => {
        if (!licencia.trim() || !dni.trim()) return Alert.alert("Campos incompletos", "Por favor, ingrese su DNI y N° de Licencia.");
        signInWithManual(licencia, dni);
    };

    const handleInternalLogin = () => {
        if (!identifier.trim() || !password.trim()) return Alert.alert("Campos incompletos", "Por favor, ingrese su email/legajo y contraseña.");
        signInWithInternal(identifier, password); 
    };
    
    const changeView = (newView: 'choice' | 'manual' | 'internal') => {
        setViewMode(newView);
        const toValue = newView === 'choice' ? 0 : 1;
        Animated.timing(transitionAnim, {
            toValue,
            duration: newView === 'choice' ? 600 : 500,
            easing: newView === 'choice' ? Easing.bezier(0.33, 1, 0.68, 1) : Easing.bezier(0.32, 0, 0.67, 0),
            useNativeDriver: true,
        }).start();
    };
    
    const goBackToChoice = () => {
        signOut();
        changeView('choice');
    };

    const getGreeting = () => {
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
                        </View>
                        <View style={styles.headerContent}>
                            <Image source={{ uri: 'https://api.transportelanus.com.ar/logo2.png' }} style={styles.logo} />
                            <Text style={styles.title}>Portal de Habilitaciones</Text>
                            <Text style={styles.subtitle}>Movilidad y Transporte - Municipio de Lanús</Text>
                        </View>
                    </View>
                    <View style={styles.formContainer}>
                        <ActionCard icon={<IdCardIcon color={themeColors.primary} />} title="Ingresar con DNI y Licencia" subtitle="Acceso para contribuyentes" onPress={() => changeView('manual')} delay={200} disabled={false} themeColors={themeColors} />
                        <ActionCard icon={<ShieldIcon color={themeColors.primary} />} title="Uso Interno" subtitle="Acceso para personal autorizado" onPress={() => changeView('internal')} delay={300} disabled={false} themeColors={themeColors} />
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </Animated.View>
    );
    
    const renderManualForm = () => (
         <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <View style={styles.manualFormContent}>
                    <View style={styles.manualHeader}><TouchableOpacity style={styles.backButtonManual} onPress={goBackToChoice}><BackIcon color={themeColors.grayMedium} /></TouchableOpacity><Text style={styles.manualTitle}>Ingreso de Contribuyente</Text><Text style={styles.manualSubtitle}>Complete los campos para acceder.</Text></View>
                    <View style={styles.manualInputs}><TextInput style={styles.input} placeholder="N° de Licencia" value={licencia} onChangeText={setLicencia} autoCapitalize="characters" placeholderTextColor={themeColors.grayMedium}/><TextInput style={styles.input} placeholder="DNI del Titular" value={dni} onChangeText={setDni} keyboardType="number-pad" placeholderTextColor={themeColors.grayMedium}/></View>
                    <View style={styles.manualFooter}><Pressable style={({ pressed }) => [styles.mainButton, pressed && styles.mainButtonPressed]} onPress={handleManualLogin} disabled={isLoading}>{isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.mainButtonText}>Ingresar</Text>}</Pressable></View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );

    const renderInternalForm = () => (
         <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <View style={styles.manualFormContent}>
                    <View style={styles.manualHeader}><TouchableOpacity style={styles.backButtonManual} onPress={goBackToChoice}><BackIcon color={themeColors.grayMedium} /></TouchableOpacity><Text style={styles.manualTitle}>Acceso Interno</Text><Text style={styles.manualSubtitle}>Ingrese sus credenciales.</Text></View>
                    <View style={styles.manualInputs}><TextInput style={styles.input} placeholder="Email o Legajo" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={themeColors.grayMedium}/><TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry={true} placeholderTextColor={themeColors.grayMedium}/></View>
                    <View style={styles.manualFooter}><Pressable style={({ pressed }) => [styles.mainButton, pressed && styles.mainButtonPressed]} onPress={handleInternalLogin} disabled={isLoading}>{isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.mainButtonText}>Iniciar Sesión</Text>}</Pressable></View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );

    return (
        <View style={{ flex: 1, backgroundColor: themeColors.background }}>
            {renderChoiceView()}
            <Animated.View style={[StyleSheet.absoluteFill, formAnimStyle]} pointerEvents={viewMode !== 'choice' ? 'auto' : 'none'}>
                {viewMode === 'manual' && renderManualForm()}
                {viewMode === 'internal' && renderInternalForm()}
            </Animated.View>
        </View>
    );
};

// --- Estilos Dinámicos (COMPLETOS Y CORREGIDOS) ---
const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    gradientContainer: { flex: 1 },
    topBar: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        width: '100%', paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? 40 : 60,
    },
    greetingText: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
    headerContainer: { flex: 0.55, justifyContent: 'center' },
    headerContent: { alignItems: 'center', paddingHorizontal: 24, },
    logo: { width: 140, height: 140, marginBottom: 24 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 8, maxWidth: 320 },
    formContainer: { 
        flex: 0.45, backgroundColor: colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, 
        paddingTop: 40, paddingHorizontal: 24, 
    },
    actionCard: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, 
        padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border,
    },
    actionIconContainer: { padding: 12, borderRadius: 12, marginRight: 16 },
    actionTextContainer: { flex: 1 },
    actionTitle: { fontSize: 16, color: colors.text, fontWeight: 'bold' },
    actionSubtitle: { fontSize: 14, color: colors.grayMedium, marginTop: 4 },
    manualFormContent: { flex: 1, padding: 24, justifyContent: 'space-between' },
    manualHeader: { alignItems: 'center', flex: 1, justifyContent: 'center' },
    manualTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text },
    manualSubtitle: { fontSize: 16, color: colors.grayMedium, marginTop: 8, textAlign: 'center' },
    manualInputs: { width: '100%', paddingBottom: 20 },
    input: { 
        backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, 
        width: '100%', height: 55, marginBottom: 16, paddingHorizontal: 15, fontSize: 16, color: colors.text 
    },
    manualFooter: { width: '100%', paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
    backButtonManual: { position: 'absolute', top: 10, left: 0, padding: 5 },
    mainButton: { 
        backgroundColor: colors.primary, padding: 15, borderRadius: 12, 
        alignItems: 'center', justifyContent: 'center', height: 55,
    },
    mainButtonPressed: { opacity: 0.8 },
    mainButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    shape1: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.1)', top: '15%', left: '10%' },
    shape2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255, 255, 255, 0.08)', top: '60%', right: '-10%' },
    shape3: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 255, 255, 0.12)', bottom: '5%', left: '25%' },
    shape4: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', top: '5%', right: '20%' },
});