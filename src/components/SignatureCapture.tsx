import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';

interface SignatureCaptureProps {
  inspectorSignature: string | null;
  driverSignature: string | null;
  onInspectorSign: (signature: string) => void;
  onDriverSign: (signature: string) => void;
}

const SignatureCapture: React.FC<SignatureCaptureProps> = ({ 
  onInspectorSign, 
  onDriverSign 
}) => {
  const inspectorRef = useRef<SignatureViewRef>(null);
  const driverRef = useRef<SignatureViewRef>(null);

  const handleClearInspector = () => inspectorRef.current?.clearSignature();
  const handleConfirmInspector = () => inspectorRef.current?.readSignature();

  const handleClearDriver = () => driverRef.current?.clearSignature();
  const handleConfirmDriver = () => driverRef.current?.readSignature();

  const webStyle = `
    .m-signature-pad { box-shadow: none; border: none; }
    .m-signature-pad--body { border: 1px solid #eee; }
    .m-signature-pad--footer { display: none; }
  `;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firma del Inspector</Text>
      <View style={styles.signatureBox}>
        <SignatureScreen
          ref={inspectorRef}
          onOK={onInspectorSign}
          webStyle={webStyle}
          backgroundColor="#ffffff"
        />
      </View>
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.button} onPress={handleClearInspector}>
            <Text style={styles.buttonText}>Limpiar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleConfirmInspector}>
            <Text style={[styles.buttonText, styles.primaryButtonText]}>Confirmar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Firma del Conductor</Text>
      <View style={styles.signatureBox}>
        <SignatureScreen
          ref={driverRef}
          onOK={onDriverSign}
          webStyle={webStyle}
          backgroundColor="#ffffff"
        />
      </View>
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.button} onPress={handleClearDriver}>
            <Text style={styles.buttonText}>Limpiar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleConfirmDriver}>
            <Text style={[styles.buttonText, styles.primaryButtonText]}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  signatureBox: {
    height: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
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
  buttonText: {
    color: '#007AFF',
  },
  primaryButtonText: {
    color: 'white',
  },
});

export default SignatureCapture;
