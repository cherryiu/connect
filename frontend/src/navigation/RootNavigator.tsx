import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { Hangout } from '../api/hangoutsApi';
import HangoutFormScreen from '../screens/HangoutFormScreen';
import LoginScreen from '../screens/LoginScreen';
import ScrapbookCalendarScreen from '../screens/ScrapbookCalendarScreen';
import ViewProfileScreen from '../screens/ViewProfileScreen';

// ensures that the navigation stack is type-safe and that the screens are properly defined with their expected parameters.
export type RootStackParamList = {
  HangoutForm: { hangout?: Hangout } | undefined;
  Login: undefined;
  ScrapbookCalendarScreen: undefined;
  ViewProfileScreen: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>({
  initialRouteName: 'Login',
  screenOptions: {
    headerShown: false,
  },
  screens: {
    HangoutForm: HangoutFormScreen,
    Login: LoginScreen,
    ScrapbookCalendarScreen,
    ViewProfileScreen,
  },
});

export const RootNavigator = createStaticNavigation(RootStack);
