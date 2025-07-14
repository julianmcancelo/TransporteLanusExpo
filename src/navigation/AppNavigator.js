// =================================================================
// src/navigation/AppNavigator.js - GESTOR DE NAVEGACIÓN
// =================================================================
import { createStackNavigator } from '@react-navigation/stack';
import { useContext } from 'react';
import CredentialScreen from '../../app/(contribuyente)/screens/CredentialScreen/CredentialScreen';
import HomeScreen from '../../app/(contribuyente)/screens/HomeScreen/HomeScreen';
import LoginScreen from '../../app/(contribuyente)/screens/LoginScreen/LoginScreen';
import { AuthContext } from '../contexts/AuthContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { userSession } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userSession ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Credential" component={CredentialScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
