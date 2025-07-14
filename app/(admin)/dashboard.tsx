// app/(admin)/dashboard.tsx

import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AdminDashboard() {
  const { userSession } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Administrador</Text>
      
      {userSession && userSession.rol === 'admin' && (
        <>
          <Text style={styles.subtitle}>Bienvenido, {userSession.nombre}.</Text>
          <Text style={styles.info}>Rol: {userSession.rol}</Text>
          <Text style={styles.info}>Email: {userSession.email}</Text>
        </>
      )}
      
      <View style={styles.content}>
        <Text>Aquí irán las estadísticas y herramientas de gestión.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 20,
    color: '#333',
  },
  info: {
    fontSize: 16,
    color: 'gray',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
});