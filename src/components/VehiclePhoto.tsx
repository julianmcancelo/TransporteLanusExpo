import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Photo } from '../types/habilitacion';

interface VehiclePhotoProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
}

const VehiclePhoto: React.FC<VehiclePhotoProps> = ({ photos, onPhotosChange }) => {

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para tomar fotos.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      const newPhoto: Photo = {
        uri: result.assets[0].uri,
        // base64 and location would be added here if needed
        location: null,
        item_id: 'vehicle_photo' // Generic ID for vehicle photos
      };
      onPhotosChange([...photos, newPhoto]);
    }
  };

  const removePhoto = (uri: string) => {
    onPhotosChange(photos.filter(p => p.uri !== uri));
  };

  const renderPhoto = ({ item }: { item: Photo }) => (
    <View style={styles.photoContainer}>
      <Image source={{ uri: item.uri }} style={styles.photo} />
      <TouchableOpacity onPress={() => removePhoto(item.uri)} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>X</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
        <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
            <Text style={styles.buttonText}>Tomar Foto del Vehículo</Text>
        </TouchableOpacity>
        <FlatList
            data={photos}
            renderItem={renderPhoto}
            keyExtractor={item => item.uri}
            numColumns={3}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay fotos aún.</Text>}
        />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoContainer: {
    position: 'relative',
    margin: 5,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
});

export default VehiclePhoto;
