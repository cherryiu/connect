import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { Hangout } from '../api/hangoutsApi';
import type { LocationVisitSummary } from '../api/locationApi';
import FriendsScreen from '../screens/FriendsScreen';
import HangoutFormScreen from '../screens/HangoutFormScreen';
import LoginScreen from '../screens/LoginScreen';
import LogsScreen from '../screens/LogsScreen';
import PlaceHistoryScreen from '../screens/PlaceHistoryScreen';
import ScrapbookCalendarScreen from '../screens/ScrapbookCalendarScreen';
import ViewProfileScreen from '../screens/ViewProfileScreen';

// ensures that the navigation stack is type-safe and that the screens are properly defined with their expected parameters.
export type RootStackParamList = {
  FriendsScreen: undefined;
  HangoutForm: { hangout?: Hangout } | undefined;
  Login: undefined;
  LogsScreen: undefined;
  PlaceHistoryScreen: { editHangoutId?: string; place: LocationVisitSummary };
  ScrapbookCalendarScreen: undefined;
  ViewProfileScreen: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>({
  initialRouteName: 'Login',
  screenOptions: {
    animation: 'none',
    gestureEnabled: false,
    headerShown: false,
  },
  screens: {
    FriendsScreen,
    HangoutForm: HangoutFormScreen,
    Login: LoginScreen,
    LogsScreen,
    PlaceHistoryScreen,
    ScrapbookCalendarScreen,
    ViewProfileScreen,
  },
});

export const RootNavigator = createStaticNavigation(RootStack);
