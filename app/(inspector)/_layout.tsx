// app/(inspector)/_layout.tsx
import { useAuth } from '@/contexts/AuthContext';
import { Stack, useRouter } from 'expo-router';
import React from 'react';

// --- Paleta de Colores (se mantiene por si se usa en otros componentes) ---
const theme = {
    background: '#FFFFFF',
    iconColor: '#3B82F6',
    textColor: '#1E293B',
};

export default function InspectorLayout() {
    const { signOut } = useAuth();
    const router = useRouter();

    return (
        <Stack
            // ✅ CORRECCIÓN: Se oculta el header por defecto para todo el grupo de rutas.
            screenOptions={{
                headerShown: false,
            }}
        >
            {/* Al tener headerShown: false en screenOptions,
                no es necesario declararlo en cada pantalla,
                a menos que se quiera mostrar específicamente en alguna.
            */}
            <Stack.Screen name="inspecciones" />
            <Stack.Screen name="nueva-inspeccion" />
            <Stack.Screen name="inspeccion-detalle" />
            <Stack.Screen name="inspection-form" />
            <Stack.Screen name="seleccionar-tramite" />
            <Stack.Screen name="verification" />
            <Stack.Screen name="obleas/index" />
            <Stack.Screen name="obleas/[id]" />
        </Stack>
    );
}
