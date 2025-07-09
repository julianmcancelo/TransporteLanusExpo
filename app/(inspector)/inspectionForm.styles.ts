import { createStyleSheet } from 'react-native-unistyles';
import type { AppTheme } from '../../src/unistyles';

export const stylesheet = createStyleSheet((theme: AppTheme) => ({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1, padding: theme.spacing.medium },

    // MEJORA: Tipografía con mejor jerarquía
    mainTitle: {
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.xsmall,
        fontSize: { xs: 24, sm: 26 },
    },
    subtitle: {
        color: theme.colors.grayMedium,
        textAlign: 'center',
        marginBottom: theme.spacing.large,
        fontSize: { xs: 15, sm: 16 },
    },
    progressContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.large },
    step: { alignItems: 'center', flex: 1 },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.cardBackground,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.grayLight,
        // MEJORA: Sombra sutil para dar profundidad
        ...theme.shadows.light
    },
    stepNumber: { color: theme.colors.grayMedium, fontWeight: 'bold' },
    stepLabel: { color: theme.colors.grayMedium, marginTop: theme.spacing.small, textAlign: 'center', fontSize: { xs: 11, sm: 12 }, fontWeight: '500' },
    stepLine: { flex: 1, height: 3, backgroundColor: theme.colors.grayLight, top: 15, marginHorizontal: -theme.spacing.medium },
    stepContent: { flex: 1 },
    stepInfoText: { color: theme.colors.grayMedium, textAlign: 'center', marginBottom: theme.spacing.large, paddingHorizontal: theme.spacing.medium, fontSize: { xs: 14, sm: 15 }, lineHeight: 22 },
    
    // --- Estilos de Navegación Inferior ---
    footerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.small, borderTopWidth: 1, borderTopColor: theme.colors.grayLight },
    navButton: {
        paddingVertical: theme.spacing.medium,
        paddingHorizontal: theme.spacing.large,
        borderRadius: theme.borderRadius.large,
        ...theme.shadows.medium, // MEJORA: Sombra más pronunciada para botones de acción
    },
    navButtonText: { color: theme.colors.text, fontWeight: 'bold', fontSize: { xs: 15, sm: 16 } },
    navButtonPrimary: { backgroundColor: theme.colors.success },
    navButtonPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: { xs: 15, sm: 16 } },

    // --- Estilos de los ítems de inspección ---
    categoryContainer: { 
        backgroundColor: theme.colors.cardBackground, 
        borderRadius: theme.borderRadius.medium, 
        marginBottom: theme.spacing.medium, 
        ...theme.shadows.medium,
        overflow: 'hidden' // Necesario para que el borde redondeado contenga a los hijos
    },
    categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.medium },
    categoryTitle: { fontSize: { xs: 17, sm: 18 }, fontWeight: 'bold', color: theme.colors.text },
    itemsList: { 
        borderTopWidth: 1, 
        borderTopColor: theme.colors.grayLight
    },
    itemContainer: { 
        padding: theme.spacing.medium, 
        borderBottomWidth: 1, 
        borderBottomColor: theme.colors.grayLight 
    },
    itemContainerLast: {
        borderBottomWidth: 0,
    },
    itemTitle: { fontSize: { xs: 15, sm: 16 }, color: theme.colors.text, marginBottom: theme.spacing.medium, fontWeight: '500' },
    estadoContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: theme.spacing.medium, gap: theme.spacing.small },
    estadoButton: { 
        paddingVertical: theme.spacing.small, 
        borderRadius: theme.borderRadius.large, 
        flex: 1, 
        alignItems: 'center',
        borderWidth: 1.5,
    },
    estadoButtonText: { fontSize: { xs: 13, sm: 14 }, fontWeight: 'bold' },
    textInputObservacion: { backgroundColor: theme.colors.grayLight, borderRadius: theme.borderRadius.small, padding: theme.spacing.medium, height: 80, textAlignVertical: 'top', fontSize: { xs: 13, sm: 14 }, color: theme.colors.text },
    
    // --- Estilos de las Fotos ---
    photoSectionContainer: { backgroundColor: theme.colors.cardBackground, borderRadius: theme.borderRadius.medium, padding: theme.spacing.medium, marginBottom: theme.spacing.large, ...theme.shadows.medium },
    sectionTitle: { fontSize: { xs: 17, sm: 18 }, fontWeight: 'bold', color: theme.colors.text, marginBottom: theme.spacing.medium, paddingBottom: theme.spacing.small, borderBottomWidth: 1, borderBottomColor: theme.colors.grayLight },
    vehiclePhotoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    vehiclePhotoSlot: { width: '48.5%', marginBottom: theme.spacing.medium, alignItems: 'center' },
    // MEJORA: Área para añadir foto más limpia
    addPhotoButton: {
        width: '100%',
        height: { xs: 120, sm: 140 },
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.grayLight,
        borderRadius: theme.borderRadius.medium,
        borderWidth: 0, // Se quita el borde punteado
    },
    addPhotoButtonText: { color: theme.colors.primary, fontWeight: 'bold', marginTop: theme.spacing.small, fontSize: { xs: 13, sm: 14 }, textAlign: 'center' },
    thumbnail: { width: '100%', height: { xs: 120, sm: 140 }, borderRadius: theme.borderRadius.medium },
    thumbnailWrapper: { position: 'relative', width: '100%' },
    removePhotoButton: { position: 'absolute', top: -10, right: -10, backgroundColor: theme.colors.error, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', ...theme.shadows.medium },
    removePhotoButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, lineHeight: 18 },
    itemPhotoContainer: { marginTop: theme.spacing.medium, paddingTop: theme.spacing.medium, borderTopWidth: 1, borderTopColor: theme.colors.grayLight },
    itemPhotoLabel: { fontSize: { xs: 13, sm: 14 }, fontWeight: '600', color: theme.colors.grayMedium, marginBottom: theme.spacing.small },
    thumbnailWrapperSmall: { position: 'relative', width: 100, height: 100 },
    thumbnailSmall: { width: '100%', height: '100%', borderRadius: theme.borderRadius.small },
    removePhotoButtonSmall: { position: 'absolute', top: -8, right: -8, backgroundColor: theme.colors.error, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', ...theme.shadows.medium },
    addPhotoButtonSmall: { paddingVertical: theme.spacing.small, paddingHorizontal: theme.spacing.medium, backgroundColor: theme.colors.grayLight, borderRadius: theme.borderRadius.large, alignSelf: 'flex-start' },
    addPhotoButtonTextSmall: { color: theme.colors.primary, fontWeight: 'bold', fontSize: { xs: 13, sm: 14 } },
    optionalPhotoContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: '5%' },
    
    // --- Estilos de Firmas y Checkbox ---
    signatureCard: { backgroundColor: theme.colors.cardBackground, padding: theme.spacing.large, borderRadius: theme.borderRadius.medium, marginHorizontal: theme.spacing.xsmall, marginBottom: theme.spacing.medium, ...theme.shadows.medium },
    cardTitle: { fontSize: { xs: 17, sm: 18 }, fontWeight: 'bold', color: theme.colors.text, marginBottom: theme.spacing.medium },
    signaturePlaceholder: { height: 120, backgroundColor: theme.colors.grayLight, borderRadius: theme.borderRadius.medium, justifyContent: 'center', alignItems: 'center' },
    signaturePlaceholderText: { color: theme.colors.grayMedium, fontWeight: 'bold' },
    signatureImage: { width: '100%', height: '100%' },
    signatureConfirmation: { color: theme.colors.success, fontWeight: 'bold', marginTop: theme.spacing.small, textAlign: 'center' },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: theme.spacing.xsmall, marginVertical: theme.spacing.large, padding: theme.spacing.medium, backgroundColor: theme.colors.cardBackground, borderRadius: theme.borderRadius.medium, ...theme.shadows.medium },
    checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: theme.colors.primary, borderRadius: theme.borderRadius.small, marginRight: theme.spacing.medium, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
    checkboxChecked: { width: 14, height: 14, backgroundColor: theme.colors.primary, borderRadius: 2 },
    checkboxLabel: { fontSize: { xs: 15, sm: 16 }, color: theme.colors.text, flex: 1 },

    // --- Estilos del Modal ---
    modalContainer: { flex: 1, justifyContent: 'center', padding: theme.spacing.medium, backgroundColor: '#fff' },
    modalTitle: { fontSize: { xs: 20, sm: 22 }, fontWeight: 'bold', textAlign: 'center', marginBottom: theme.spacing.large },
    modalCloseButton: { marginTop: theme.spacing.medium, padding: theme.spacing.medium, alignItems: 'center' },
    modalCloseButtonText: { color: theme.colors.primary, fontSize: { xs: 15, sm: 16 }, fontWeight: 'bold' },
}));