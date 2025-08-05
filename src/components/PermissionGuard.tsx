import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePermissions } from '../contexts/AuthContext';
import { UserPermissions } from '../types/user';

type PermissionGuardProps = {
    permission: keyof UserPermissions | 'isMaster';
    fallback?: ReactNode;
    children: ReactNode;
};

/**
 * Componente que controla el acceso a ciertas funciones basado en permisos del usuario
 * Si el usuario tiene el permiso requerido, se muestra el contenido children
 * Si no, se muestra el contenido fallback (o nada si no se proporciona)
 */
export const PermissionGuard = ({ permission, fallback = null, children }: PermissionGuardProps) => {
    const { hasPermission, isMasterUser } = usePermissions();
    
    // El usuario master siempre tiene acceso a todo
    if (isMasterUser()) {
        return <>{children}</>;
    }
    
    // Si el permiso es específicamente verificar si es master
    if (permission === 'isMaster') {
        return <>{fallback}</>;
    }
    
    // Para otros permisos, verificar contra la lista de permisos
    if (hasPermission(permission)) {
        return <>{children}</>;
    }
    
    // Si no tiene el permiso, mostrar el fallback
    return <>{fallback}</>;
};

/**
 * Componente que muestra un mensaje cuando no se tiene acceso
 */
export const AccessDenied = ({ message = "No tiene permisos para acceder a esta función" }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Acceso Denegado</Text>
            <Text style={styles.message}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2', // Light red background
        borderRadius: 8,
        margin: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#B91C1C', // Dark red text
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#7F1D1D', // Even darker red
        textAlign: 'center',
    }
});
