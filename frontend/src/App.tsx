import React from 'react';
import RootNavigator from './navigation/RootNavigator';
import { StyleSheet, View } from 'react-native';
import AppProviders from './context/AppContext';

export default function App() {
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
});
