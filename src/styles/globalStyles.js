// src/styles/globalStyles.js
import { StyleSheet } from 'react-native';

// globalStyles ahora es una FUNCIÓN que devuelve los estilos.
export const globalStyles = (themeColors) => StyleSheet.create({
  mainButton: {
    backgroundColor: themeColors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  mainButtonText: {
    color: themeColors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: themeColors.card,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: themeColors.border || themeColors.primary, // Usamos 'border' o 'primary' como fallback
    width: '100%',
  },
  secondaryButtonText: {
    color: themeColors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});