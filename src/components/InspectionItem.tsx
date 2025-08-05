import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { InspectionItem as InspectionItemType } from '../types/habilitacion';

interface InspectionItemProps {
  item: InspectionItemType;
  onStateChange: (itemId: string, newState: 'OK' | 'NO' | 'NA') => void;
}

const InspectionItem: React.FC<InspectionItemProps> = ({ item, onStateChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.description}>{item.description}</Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, item.state === 'OK' && styles.okButtonSelected]}
          onPress={() => onStateChange(item.id, 'OK')}>
          <Text style={[styles.buttonText, item.state === 'OK' && styles.selectedButtonText]}>OK</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, item.state === 'NO' && styles.noButtonSelected]}
          onPress={() => onStateChange(item.id, 'NO')}>
          <Text style={[styles.buttonText, item.state === 'NO' && styles.selectedButtonText]}>NO</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, item.state === 'NA' && styles.naButtonSelected]}
          onPress={() => onStateChange(item.id, 'NA')}>
          <Text style={[styles.buttonText, item.state === 'NA' && styles.selectedButtonText]}>NA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  description: {
    flex: 1,
    fontSize: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  selectedButtonText: {
    color: 'white',
  },
  okButtonSelected: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  noButtonSelected: {
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
  },
  naButtonSelected: {
    backgroundColor: '#6c757d',
    borderColor: '#6c757d',
  },
});

export default InspectionItem;
