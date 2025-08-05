import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
  SafeAreaView,
} from 'react-native';

// Contexts & Hooks
// Import commented out since it's not currently used
// import { useAuth } from '../../src/contexts/AuthContext';

// Components
import StepIndicator from '../../src/components/StepIndicator';
import InspectionItemComponent from '../../src/components/InspectionItem';
import ActionButtons from '../../src/components/ActionButtons';
import VehiclePhoto from '../../src/components/VehiclePhoto';
import SignatureCapture from '../../src/components/SignatureCapture';

// Types
import { Tramite, InspectionItem, Photo } from '../../src/types/habilitacion';

// Styles
import { getStyles } from '../../src/styles/InspectionFormStyles';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Mock useTheme to avoid breaking while it's not available
const useTheme = () => ({ theme: {} });

const InspectionFormScreen = () => {
  // Auth hooks removed as they're not currently used in this component
  // const { userSession } = useAuth();

  const params = useLocalSearchParams();
  const tramite: Tramite | null = params.tramite ? JSON.parse(params.tramite as string) : null;

  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [currentStep, setCurrentStep] = useState(0);
  const [items, setItems] = useState<InspectionItem[]>(tramite?.items || []);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [inspectorSignature, setInspectorSignature] = useState<string | null>(null);
  const [driverSignature, setDriverSignature] = useState<string | null>(null);

  const handlePhotosChange = (newPhotos: Photo[]) => {
    setPhotos(newPhotos);
  };

  const handleInspectorSign = (signature: string) => {
    setInspectorSignature(signature);
  };

  const handleDriverSign = (signature: string) => {
    setDriverSignature(signature);
  };

  const handleItemStateChange = (itemId: string, newState: 'OK' | 'NO' | 'NA') => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, state: newState } : item
      )
    );
  };

  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    // Expand the first category by default
    tramite?.items && tramite.items.length > 0 ? tramite.items[0].category : null
  );

  const itemsByCategory = useMemo(() => {
    return items.reduce((acc, item) => {
      const category = item.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, InspectionItem[]>);
  }, [items]);

  const toggleCategory = (category: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleFinalizeInspection = async () => {
    setIsSaving(true);
    console.log('Finalizing inspection...');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const finalData = {
      ...tramite,
      items,
      photos,
      inspectorSignature,
      driverSignature,
      fecha_inspeccion: new Date().toISOString(),
      resultado_final: items.some(item => item.state === 'NO') ? 'RECHAZADO' : 'APROBADO',
    };

    console.log('Submitting data:', JSON.stringify(finalData, null, 2));
    // TODO: Implement actual submission to backend and local storage

    setIsSaving(false);
    // TODO: Navigate back or to a success screen
    alert('Inspección finalizada y guardada.');
  };

  if (!tramite) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Error: No se ha proporcionado un trámite válido.</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `Inspección #${tramite.nro_licencia}` }} />
      <SafeAreaView style={styles.container}>
        <StepIndicator currentStep={currentStep} steps={['Ítems', 'Fotos', 'Firmas']} />

        {currentStep === 0 && (
          <ScrollView>
            {Object.entries(itemsByCategory).map(([category, catItems]) => (
              <View key={category}>
                <TouchableOpacity onPress={() => toggleCategory(category)} >
                  <Text>{category}</Text>
                  <Text>{expandedCategory === category ? '−' : '+'}</Text>
                </TouchableOpacity>
                {expandedCategory === category &&
                  catItems.map(item => (
                    <InspectionItemComponent key={item.id} item={item} onStateChange={handleItemStateChange} />
                  ))}
              </View>
            ))}
          </ScrollView>
        )}

        {currentStep === 1 && (
          <VehiclePhoto photos={photos} onPhotosChange={handlePhotosChange} />
        )}
        {currentStep === 2 && (
          <SignatureCapture 
            inspectorSignature={inspectorSignature}
            driverSignature={driverSignature}
            onInspectorSign={handleInspectorSign}
            onDriverSign={handleDriverSign}
          />
        )}

        <ActionButtons
          onPrev={() => setCurrentStep(s => Math.max(0, s - 1))}
          onNext={() => setCurrentStep(s => Math.min(2, s + 1))}
          onFinalize={handleFinalizeInspection}
          isFirstStep={currentStep === 0}
          isLastStep={currentStep === 2}
          isSaving={isSaving}
        />
      </SafeAreaView>
    </>
  );
};

export default InspectionFormScreen;