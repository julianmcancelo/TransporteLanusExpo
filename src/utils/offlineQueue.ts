import AsyncStorage from '@react-native-async-storage/async-storage';

export const QUEUE_KEY = '@inspeccionQueue';

/**
 * Obtiene la cola de inspecciones pendientes desde AsyncStorage.
 * @returns {Promise<any[]>} Una promesa que se resuelve con el array de inspecciones pendientes.
 */
export const getPendingInspections = async (): Promise<any[]> => {
    try {
        const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
        return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
        console.error('Error getting pending inspections:', error);
        return [];
    }
};

/**
 * Guarda la cola de inspecciones pendientes en AsyncStorage.
 * @param {any[]} queue El array de inspecciones pendientes para guardar.
 * @returns {Promise<void>}
 */
export const savePendingInspections = async (queue: any[]): Promise<void> => {
    try {
        const queueJson = JSON.stringify(queue);
        await AsyncStorage.setItem(QUEUE_KEY, queueJson);
    } catch (error) {
        console.error('Error saving pending inspections:', error);
    }
};
