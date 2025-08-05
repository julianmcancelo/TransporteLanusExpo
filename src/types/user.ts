// src/types/user.ts - Types related to user profiles and authentication

// Define tipos de usuario para el sistema
// Agregamos el rol 'master' para usuario con permisos completos
export interface UserProfile {
    id: string;
    nombre: string;
    email?: string;
    rol: 'contribuyente' | 'admin' | 'inspector' | 'master';
    legajo?: string;
    avatarUrl?: string;
    // Otros campos de perfil según necesidad
}

// Interfaz para manejar permisos según el rol
export interface UserPermissions {
    canCreateUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;
    canApproveRequests: boolean;
    canViewReports: boolean;
    canExportData: boolean;
    canAccessAdminPanel: boolean;
    canAccessInspectionPanel: boolean;
    canOverrideSystem: boolean;  // Solo para master
}

// Función para obtener permisos según el rol
export const getRolePermissions = (rol: string): UserPermissions => {
    switch (rol) {
        case 'master':
            return {
                canCreateUsers: true,
                canEditUsers: true,
                canDeleteUsers: true,
                canApproveRequests: true,
                canViewReports: true,
                canExportData: true,
                canAccessAdminPanel: true,
                canAccessInspectionPanel: true,
                canOverrideSystem: true,  // Solo para master
            };
        case 'admin':
            return {
                canCreateUsers: true,
                canEditUsers: true,
                canDeleteUsers: false,
                canApproveRequests: true,
                canViewReports: true,
                canExportData: true,
                canAccessAdminPanel: true,
                canAccessInspectionPanel: false,
                canOverrideSystem: false,
            };
        case 'inspector':
            return {
                canCreateUsers: false,
                canEditUsers: false,
                canDeleteUsers: false,
                canApproveRequests: false,
                canViewReports: true,
                canExportData: false,
                canAccessAdminPanel: false,
                canAccessInspectionPanel: true,
                canOverrideSystem: false,
            };
        case 'contribuyente':
        default:
            return {
                canCreateUsers: false,
                canEditUsers: false,
                canDeleteUsers: false,
                canApproveRequests: false,
                canViewReports: false,
                canExportData: false,
                canAccessAdminPanel: false,
                canAccessInspectionPanel: false,
                canOverrideSystem: false,
            };
    }
};
