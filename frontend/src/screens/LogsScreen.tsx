import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getUserLocationVisits,
  syncLocationVisits,
  type LocationVisitSummary,
} from '../api/locationApi';
import BottomNavBar from '../components/bars/BottomNavBar';
import TopBar from '../components/bars/TopBar';
import VisitedPlaceCard from '../components/locations/VisitedPlaceCard';
import { COLORS, FONTS } from '../constants';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

type LogsNavigation = NativeStackNavigationProp<RootStackParamList, 'LogsScreen'>;

export default function LogsScreen() {
  const navigation = useNavigation<LogsNavigation>();
  const { isLoading: authLoading, isLoggedIn, logout, user } = useAuth();
  const [places, setPlaces] = useState<LocationVisitSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) navigation.replace('Login');
  }, [authLoading, isLoggedIn, navigation]);

  const loadPlaces = useCallback(async () => {
    if (!user?.authUserId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(undefined);
      await syncLocationVisits();
      setPlaces(await getUserLocationVisits(user.authUserId));
    } catch {
      setError('Your place logs could not be refreshed. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.authUserId]);

  useFocusEffect(
    useCallback(() => {
      void loadPlaces();
    }, [loadPlaces]),
  );

  const totalVisits = places.reduce((total, place) => total + place.visitCount, 0);

  return (
    <SafeAreaView style={styles.safeArea} testID="logs-screen">
      <View style={styles.screen}>
        <PaperSpeckles />
        <TopBar avatarUrl={user?.avatarUrl} onLogout={logout} />

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                setRefreshing(true);
                void loadPlaces();
              }}
              refreshing={refreshing}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>places visited</Text>
          <Text style={styles.subtitle}>
            {places.length} {places.length === 1 ? 'place' : 'places'} · {totalVisits}{' '}
            {totalVisits === 1 ? 'visit' : 'visits'}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={COLORS.tealDark} />
              <Text style={styles.loadingText}>CHECKING YOUR LOGS...</Text>
            </View>
          ) : places.length ? (
            <View style={styles.placeList}>
              {places.map((place) => (
                <VisitedPlaceCard key={place.location.toLowerCase()} place={place} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyMark}>⌖</Text>
              <Text style={styles.emptyTitle}>NO PLACES LOGGED YET</Text>
              <Text style={styles.emptyCopy}>
                Places appear here after a hangout with a location has ended.
              </Text>
            </View>
          )}
        </ScrollView>

        <BottomNavBar
          activeItem="logs"
          onCalendar={() => navigation.navigate('ScrapbookCalendarScreen')}
          onCreate={() => navigation.navigate('HangoutForm')}
          onFriends={() => navigation.navigate('FriendsScreen')}
          onLogs={() => undefined}
        />
      </View>
    </SafeAreaView>
  );
}

function PaperSpeckles() {
  return (
    <View pointerEvents="none" style={styles.speckles}>
      {Array.from({ length: 24 }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.speck,
            {
              left: `${(index * 37) % 97}%`,
              top: `${(index * 61) % 96}%`,
              transform: [{ rotate: `${index * 17}deg` }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#fbf5ef', flex: 1 },
  screen: { backgroundColor: '#fbf5ef', flex: 1 },
  speckles: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  speck: {
    backgroundColor: 'rgba(156, 65, 65, 0.16)',
    height: 1,
    position: 'absolute',
    width: 3,
  },
  content: { paddingBottom: 128, paddingHorizontal: 18, paddingTop: 28 },
  title: {
    color: COLORS.black,
    fontFamily: FONTS.secondaryBold,
    fontSize: 36,
    lineHeight: 42,
  },
  subtitle: {
    color: COLORS.text,
    fontFamily: FONTS.primary,
    fontSize: 10,
    letterSpacing: 0.7,
    marginBottom: 24,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  error: {
    backgroundColor: 'rgba(156,65,65,0.10)',
    color: COLORS.primary,
    fontFamily: FONTS.primary,
    fontSize: 10,
    marginBottom: 14,
    padding: 10,
  },
  placeList: { paddingRight: 4 },
  loadingState: {
    alignItems: 'center',
    borderColor: COLORS.teal,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 180,
  },
  loadingText: { color: COLORS.muted, fontFamily: FONTS.primary, fontSize: 10, marginTop: 10 },
  emptyState: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderColor: COLORS.teal,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 240,
    padding: 28,
  },
  emptyMark: { color: COLORS.coral, fontSize: 35, marginBottom: 8 },
  emptyTitle: {
    color: COLORS.black,
    fontFamily: FONTS.primaryBold,
    fontSize: 12,
    letterSpacing: 0.9,
  },
  emptyCopy: {
    color: COLORS.muted,
    fontFamily: FONTS.secondaryLight,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 9,
    textAlign: 'center',
  },
});
