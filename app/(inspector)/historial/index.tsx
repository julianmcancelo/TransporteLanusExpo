// =================================================================
// app/(inspector)/historial/index.tsx - v2.3 (Corrección de Tipos)
// Pantalla para que el inspector busque por dominio, adaptada a la API PHP.
// =================================================================
import { Feather as Icon } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import { API_HISTORY_DATA_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

// --- INTERFACES DE DATOS (Adaptadas a la respuesta de ver_historial.php) ---
export interface InspeccionDetalle {
    nombre_item: string;
    estado: 'ok' | 'no_ok' | 'no_aplica';
    observacion: string | null;
}

export interface InspeccionFoto {
    foto_path: string;
    tipo_foto: string;
}

// Interfaz que usan los componentes de la UI
export interface InspeccionHistorial {
    id: number;
    fecha: string;
    resultado: 'Aprobado' | 'Rechazado' | 'Condicional';
    inspector_nombre: string;
    vehiculo_dominio: string;
    observaciones?: string;
    detalles: InspeccionDetalle[];
    fotos: InspeccionFoto[];
    firma_inspector: string;
    firma_contribuyente: string;
}

// Interfaz que coincide con la respuesta de la API
interface ApiInspeccion {
    id: number;
    fecha_inspeccion: string;
    nombre_inspector: string;
    firma_inspector: string;
    firma_contribuyente: string;
    detalles: InspeccionDetalle[];
    fotos: InspeccionFoto[];
    observaciones?: string;
}


const HistorialSearchScreen = () => {
    const [licencia, setLicencia] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const router = useRouter();
    const { userSession } = useAuth();

    const handleSearch = async () => {
        const dominio = licencia.trim().toUpperCase();
        if (!dominio) {
            setError('Por favor, ingresa un dominio.');
            return;
        }
        Keyboard.dismiss();
        setIsLoading(true);
        setError('');

        if (!userSession || userSession.rol !== 'inspector') {
            setError('No tienes permisos para realizar esta acción.');
            setIsLoading(false);
            return;
        }

        try {
            // Se construye la URL con el parámetro GET como espera el PHP.
            const url = `${API_HISTORY_DATA_URL}?nro_licencia=${dominio}`;
            
            const response = await fetch(url, {
                method: 'GET', // Se usa GET
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${userSession.token}`,
                },
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                const habilitacion = result.data;
                const inspeccionesApi: ApiInspeccion[] = habilitacion.inspecciones || [];
                
                if (inspeccionesApi.length === 0) {
                   throw new Error('No se encontraron inspecciones para el dominio ingresado.');
                }

                // Se procesa la respuesta de la API para adaptarla a la UI.
                const historialProcesado: InspeccionHistorial[] = inspeccionesApi.map(inspeccion => {
                    // 1. Determina el resultado basado en los detalles
                    let resultadoGeneral: 'Aprobado' | 'Rechazado' = 'Aprobado';
                    if (inspeccion.detalles?.some(d => d.estado === 'no_ok')) {
                        resultadoGeneral = 'Rechazado';
                    }

                    // 2. Construye el objeto que esperan las otras pantallas
                    return {
                        ...inspeccion,
                        fecha: inspeccion.fecha_inspeccion,
                        resultado: resultadoGeneral,
                        // CORRECCIÓN: Se mapea el nombre del campo de la API al de la UI.
                        inspector_nombre: inspeccion.nombre_inspector,
                        vehiculo_dominio: habilitacion.vehiculos?.[0]?.dominio || dominio,
                    };
                });

                router.push({
                    pathname: '/(inspector)/historial/[licencia]',
                    params: { 
                        licencia: dominio,
                        historial: JSON.stringify(historialProcesado) 
                    }
                });

            } else {
                throw new Error(result.message || 'Error en la respuesta del servidor.');
            }
        } catch (e: any) {
            setError(e.message);
            Alert.alert('Error en la Búsqueda', e.message || 'No se pudo conectar con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <Icon name="search" size={60} color="#007bff" style={styles.icon} />
                <Text style={styles.title}>Buscar Historial</Text>
                <Text style={styles.subtitle}>Ingresa el dominio del vehículo para ver sus inspecciones pasadas.</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="AAA123 o AA123AA"
                        value={licencia}
                        onChangeText={setLicencia}
                        autoCapitalize="characters"
                        placeholderTextColor="#888"
                        onSubmitEditing={handleSearch}
                    />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity style={styles.button} onPress={handleSearch} disabled={isLoading}>
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Buscar</Text>
                    )}
                </TouchableOpacity>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f4f7f9',
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        maxWidth: '80%',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    input: {
        height: 50,
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#007bff',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        marginBottom: 15,
        textAlign: 'center',
    },
});

export default HistorialSearchScreen;
