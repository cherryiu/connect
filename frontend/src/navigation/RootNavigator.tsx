import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import HangoutFormScreen from '../screens/HangoutFormScreen';
import { Hangout } from '../api/hangoutsApi';

export type RootStackParamList = {
  Calendar: undefined;
  'Hangout Form': { hangout?: Hangout } | undefined;
  'Login Page': undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Calendar" component={HomeScreen} />
      <Stack.Screen name="Hangout Form" component={HangoutFormScreen} />
      <Stack.Screen name="Login Page" component={LoginScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default RootNavigator;
