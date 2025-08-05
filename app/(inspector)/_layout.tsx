// app/(inspector)/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';


export default function InspectorLayout() {

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
            <Stack.Screen name="gestion-legajo" />
        </Stack>
    );
}
