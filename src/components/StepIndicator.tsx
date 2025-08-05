import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps }) => {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepContainer}>
          <View style={[styles.circle, index === currentStep && styles.activeCircle]}>
            <Text style={styles.stepText}>{index + 1}</Text>
          </View>
          <Text style={[styles.label, index === currentStep && styles.activeLabel]}>{step}</Text>
          {index < steps.length - 1 && <View style={styles.line} />}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCircle: {
    backgroundColor: '#007AFF',
  },
  stepText: {
    color: 'white',
    fontWeight: 'bold',
  },
  label: {
    position: 'absolute',
    top: 35,
    textAlign: 'center',
    width: 60,
    left: -15,
    fontSize: 12,
    color: '#ccc',
  },
  activeLabel: {
    color: '#000',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#ccc',
    marginHorizontal: -15,
  },
});

export default StepIndicator;
