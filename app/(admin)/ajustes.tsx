import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Switch, List } from 'react-native-paper';
import { useTheme } from '../../src/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

const SettingsScreen = () => {
  const { isDarkTheme, toggleTheme, theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ title: 'Personalización' }} />
      <View style={styles.container}>
        <List.Section style={{...styles.section, backgroundColor: theme.colors.cardBackground}}>
          <List.Item
            title="Modo Oscuro"
            description="Activa el tema oscuro para toda la aplicación"
            titleStyle={{ color: theme.colors.text }}
            descriptionStyle={{ color: theme.colors.textSecondary }}
            left={() => <List.Icon icon="brightness-6" color={theme.colors.primary} />}
            right={() => <Switch value={isDarkTheme} onValueChange={toggleTheme} color={theme.colors.primary} />}
          />
        </List.Section>
        <Text style={{...styles.infoText, color: theme.colors.textSecondary}}>
          Los cambios se guardan automáticamente y se aplicarán en tu próxima visita.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});

export default SettingsScreen;
