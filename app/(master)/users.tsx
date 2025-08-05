import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  getAdminUsers,
  updateUserStatus,
  createAdminUser,
  deleteAdminUser,
  AdminUser
} from '../../src/services/api';

// User item component
const UserItem = ({ 
  user, 
  onStatusToggle,
  onDelete,
  currentUserId
}: { 
  user: AdminUser,
  onStatusToggle: (userId: number, newStatus: 'activo' | 'inactivo') => void,
  onDelete: (userId: number) => void,
  currentUserId?: number
}) => {
  const canEdit = user.id !== currentUserId; // No puedes editar tu propio usuario
  const isMaster = user.rol === 'master';

  return (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userAvatarContainer}>
          {user.avatarUrl ? (
            <Image 
              source={{ uri: user.avatarUrl }} 
              style={styles.userAvatar} 
            />
          ) : (
            <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
              <Text style={styles.userAvatarText}>
                {user.nombre.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.nombre}</Text>
          <View style={styles.userBadgeContainer}>
            <View style={[styles.userBadge, { backgroundColor: getRolColor(user.rol) }]}>
              <Text style={styles.userBadgeText}>{user.rol.toUpperCase()}</Text>
            </View>
            <View style={[styles.userBadge, { backgroundColor: user.estado === 'activo' ? '#2ECC71' : '#E74C3C' }]}>
              <Text style={styles.userBadgeText}>{user.estado.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.userDetailsContainer}>
        <View style={styles.userDetailItem}>
          <MaterialCommunityIcons name="account" size={16} color="#555" />
          <Text style={styles.userDetailText}>Usuario: {user.usuario}</Text>
        </View>
        {user.email && (
          <View style={styles.userDetailItem}>
            <MaterialCommunityIcons name="email" size={16} color="#555" />
            <Text style={styles.userDetailText}>{user.email}</Text>
          </View>
        )}
        {user.telefono && (
          <View style={styles.userDetailItem}>
            <MaterialCommunityIcons name="phone" size={16} color="#555" />
            <Text style={styles.userDetailText}>{user.telefono}</Text>
          </View>
        )}
        {user.ultimoAcceso && (
          <View style={styles.userDetailItem}>
            <MaterialCommunityIcons name="clock" size={16} color="#555" />
            <Text style={styles.userDetailText}>Último acceso: {user.ultimoAcceso}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.userActions}>
        {canEdit ? (
          <>
            <TouchableOpacity 
              style={[styles.userActionButton, { backgroundColor: user.estado === 'activo' ? '#E74C3C' : '#2ECC71' }]}
              onPress={() => onStatusToggle(user.id, user.estado === 'activo' ? 'inactivo' : 'activo')}
            >
              <MaterialCommunityIcons 
                name={user.estado === 'activo' ? "account-cancel" : "account-check"} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.userActionText}>
                {user.estado === 'activo' ? "Desactivar" : "Activar"}
              </Text>
            </TouchableOpacity>
            
            {!isMaster && (
              <TouchableOpacity 
                style={[styles.userActionButton, { backgroundColor: '#7F8C8D' }]}
                onPress={() => onDelete(user.id)}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#fff" />
                <Text style={styles.userActionText}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.currentUserTag}>
            <MaterialCommunityIcons name="account-check" size={16} color="#1D3557" />
            <Text style={styles.currentUserText}>Usuario actual</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// New User Form component
const NewUserForm = ({ 
  visible, 
  onClose,
  onSubmit,
  loading
}: {
  visible: boolean,
  onClose: () => void,
  onSubmit: (userData: any) => void,
  loading: boolean
}) => {
  const [userData, setUserData] = useState({
    nombre: '',
    usuario: '',
    password: '',
    confirmPassword: '',
    rol: 'admin', // default
    email: '',
    telefono: '',
    estado: 'activo',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!userData.nombre) newErrors.nombre = 'El nombre es obligatorio';
    if (!userData.usuario) newErrors.usuario = 'El usuario es obligatorio';
    if (!userData.password) newErrors.password = 'La contraseña es obligatoria';
    if (userData.password !== userData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const { confirmPassword, ...submitData } = userData;
      onSubmit(submitData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setUserData({...userData, [field]: value});
    
    // Clear error when typing
    if (errors[field]) {
      setErrors({...errors, [field]: ''});
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nuevo Usuario Administrativo</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer}>
            <Text style={styles.inputLabel}>Nombre completo*</Text>
            <TextInput
              style={[styles.input, errors.nombre ? styles.inputError : null]}
              value={userData.nombre}
              onChangeText={(text) => handleChange('nombre', text)}
              placeholder="Nombre completo"
            />
            {errors.nombre ? <Text style={styles.errorText}>{errors.nombre}</Text> : null}
            
            <Text style={styles.inputLabel}>Usuario*</Text>
            <TextInput
              style={[styles.input, errors.usuario ? styles.inputError : null]}
              value={userData.usuario}
              onChangeText={(text) => handleChange('usuario', text)}
              placeholder="Nombre de usuario"
              autoCapitalize="none"
            />
            {errors.usuario ? <Text style={styles.errorText}>{errors.usuario}</Text> : null}
            
            <Text style={styles.inputLabel}>Contraseña*</Text>
            <TextInput
              style={[styles.input, errors.password ? styles.inputError : null]}
              value={userData.password}
              onChangeText={(text) => handleChange('password', text)}
              placeholder="Contraseña"
              secureTextEntry
            />
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            
            <Text style={styles.inputLabel}>Confirmar contraseña*</Text>
            <TextInput
              style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
              value={userData.confirmPassword}
              onChangeText={(text) => handleChange('confirmPassword', text)}
              placeholder="Repetir contraseña"
              secureTextEntry
            />
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            
            <Text style={styles.inputLabel}>Rol*</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  userData.rol === 'admin' ? styles.roleOptionSelected : {}
                ]}
                onPress={() => handleChange('rol', 'admin')}
              >
                <Text style={userData.rol === 'admin' ? styles.roleTextSelected : styles.roleText}>
                  Admin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  userData.rol === 'inspector' ? styles.roleOptionSelected : {}
                ]}
                onPress={() => handleChange('rol', 'inspector')}
              >
                <Text style={userData.rol === 'inspector' ? styles.roleTextSelected : styles.roleText}>
                  Inspector
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  userData.rol === 'master' ? styles.roleOptionSelected : {}
                ]}
                onPress={() => handleChange('rol', 'master')}
              >
                <Text style={userData.rol === 'master' ? styles.roleTextSelected : styles.roleText}>
                  Master
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={userData.email}
              onChangeText={(text) => handleChange('email', text)}
              placeholder="Email (opcional)"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.inputLabel}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={userData.telefono}
              onChangeText={(text) => handleChange('telefono', text)}
              placeholder="Teléfono (opcional)"
              keyboardType="phone-pad"
            />
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Helper function to get color based on role
const getRolColor = (rol: string) => {
  switch(rol) {
    case 'master': return '#8E44AD';
    case 'admin': return '#3498DB';
    case 'inspector': return '#F39C12';
    default: return '#95A5A6';
  }
};

export default function UsersScreen() {
  const { userSession } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetches users from the API
  const fetchUsers = useCallback(async (showRefreshing = false) => {
    if (!userSession?.token) return;
    
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      const response = await getAdminUsers(userSession.token);
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        Alert.alert('Error', response.message || 'No se pudieron cargar los usuarios');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Ocurrió un error al obtener los usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userSession]);

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, [userSession, fetchUsers]);

  // Handle user status toggle (activate/deactivate)
  const handleStatusToggle = async (userId: number, newStatus: 'activo' | 'inactivo') => {
    if (!userSession?.token) {
      Alert.alert('Error', 'No hay sesión de usuario');
      return;
    }

    try {
      const response = await updateUserStatus(userId, newStatus, userSession.token);
      
      if (response.success) {
        // Update local state
        setUsers((prev: AdminUser[]) => prev.map((user: AdminUser) => 
          user.id === userId ? {...user, estado: newStatus} : user
        ));
        
        Alert.alert(
          'Usuario actualizado', 
          `El usuario ha sido ${newStatus === 'activo' ? 'activado' : 'desactivado'} correctamente.`
        );
      } else {
        Alert.alert('Error', response.message || 'No se pudo actualizar el estado del usuario');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el estado del usuario');
    }
  };

  // Handle user deletion
  const handleDeleteUser = (userId: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!userSession?.token) {
              Alert.alert('Error', 'No hay sesión de usuario');
              return;
            }

            try {
              const response = await deleteAdminUser(userId, userSession.token);
              
              if (response.success) {
                // Remove from local state
                setUsers((prev: AdminUser[]) => prev.filter((user: AdminUser) => user.id !== userId));
                
                Alert.alert('Usuario eliminado', 'El usuario ha sido eliminado correctamente.');
              } else {
                Alert.alert('Error', response.message || 'No se pudo eliminar el usuario');
              }
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Ocurrió un error al eliminar el usuario');
            }
          }
        }
      ]
    );
  };

  // Handle new user creation
  const handleCreateUser = async (userData: any) => {
    if (!userSession?.token) {
      Alert.alert('Error', 'No hay sesión de usuario');
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await createAdminUser(userData, userSession.token);
      
      if (response.success) {
        // Create a new user object with the response data
        const newUser: AdminUser = {
          id: response.userId || Math.floor(Math.random() * 1000) + 5,
          nombre: userData.nombre,
          usuario: userData.usuario,
          rol: userData.rol,
          email: userData.email,
          telefono: userData.telefono,
          estado: userData.estado,
          ultimoAcceso: new Date().toISOString().split('T').join(' ').substring(0, 16)
        };
        
        // Add to local state
        setUsers((prev: AdminUser[]) => [...prev, newUser]);
        
        // Close modal and show success message
        setModalVisible(false);
        Alert.alert('Usuario creado', 'El nuevo usuario ha sido creado correctamente.');
      } else {
        Alert.alert('Error', response.message || 'No se pudo crear el usuario');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', 'Ocurrió un error al crear el usuario');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D3557" />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
        <Text style={styles.headerSubtitle}>Administración de usuarios internos</Text>
      </View>
      
      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialCommunityIcons name="account-plus" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Nuevo Usuario</Text>
        </TouchableOpacity>
      </View>

      {users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-search" size={64} color="#95A5A6" />
          <Text style={styles.emptyText}>No hay usuarios para mostrar</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <UserItem 
              user={item} 
              onStatusToggle={handleStatusToggle}
              onDelete={handleDeleteUser}
              currentUserId={userSession && 'id' in userSession ? parseInt(String(userSession.id)) : 0}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => fetchUsers(true)}
        />
      )}

      {/* New User Form Modal */}
      <NewUserForm 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreateUser}
        loading={submitLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#1D3557',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#A8DADC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1D3557',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D3557',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  userHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  userAvatarContainer: {
    marginRight: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userAvatarPlaceholder: {
    backgroundColor: '#1D3557',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userBadgeContainer: {
    flexDirection: 'row',
  },
  userBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  userBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  userDetailsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userDetailText: {
    marginLeft: 8,
    color: '#444',
  },
  userActions: {
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'flex-end',
  },
  userActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  userActionText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
  currentUserTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#E0E7F1',
  },
  currentUserText: {
    marginLeft: 4,
    color: '#1D3557',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '100%',
    maxHeight: '80%',
    padding: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#f5f5f5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 16,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#E74C3C',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  roleOptionSelected: {
    backgroundColor: '#1D3557',
  },
  roleText: {
    color: '#555',
  },
  roleTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#f5f5f5',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#444',
  },
  submitButton: {
    backgroundColor: '#1D3557',
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
