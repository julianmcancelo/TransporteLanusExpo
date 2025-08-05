import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ActionButtonsProps {
  onPrev: () => void;
  onNext: () => void;
  onFinalize: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSaving: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onPrev, onNext, onFinalize, isFirstStep, isLastStep, isSaving }) => {
  return (
    <View style={styles.container}>
      {!isFirstStep && (
        <TouchableOpacity onPress={onPrev} style={styles.button}>
          <Text>Anterior</Text>
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }} />
      {!isLastStep ? (
        <TouchableOpacity onPress={onNext} style={[styles.button, styles.primaryButton]}>
          <Text style={styles.primaryButtonText}>Siguiente</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onFinalize} disabled={isSaving} style={[styles.button, styles.primaryButton]}>
          <Text style={styles.primaryButtonText}>{isSaving ? 'Guardando...' : 'Finalizar'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: 'white',
  },
});

export default ActionButtons;
