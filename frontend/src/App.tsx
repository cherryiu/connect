import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import AppProviders from './context/AppContext';
import { COLORS } from './constants';
import { useAppFonts } from './hooks/useAppFonts';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  const [fontsLoaded, fontError] = useAppFonts();

  if (fontError) throw fontError;

  if (!fontsLoaded) {
    return (
      <View style={styles.loading} testID="app-root">
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <AppProviders>
      <View style={styles.root} testID="app-root">
        <RootNavigator />
      </View>
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    alignItems: 'center',
    backgroundColor: '#fbf5ef',
    flex: 1,
    justifyContent: 'center',
  },
});
