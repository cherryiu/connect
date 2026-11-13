import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addFriend, getFriends, searchUsers, type FriendProfile } from '../api/usersApi';
import BottomNavBar from '../components/bars/BottomNavBar';
import TopBar from '../components/bars/TopBar';
import { COLORS, FONTS } from '../constants';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

type FriendsNavigation = NativeStackNavigationProp<RootStackParamList, 'FriendsScreen'>;

export default function FriendsScreen() {
  const navigation = useNavigation<FriendsNavigation>();
  const { isLoading: authLoading, isLoggedIn, logout, user } = useAuth();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [results, setResults] = useState<FriendProfile[]>([]);
  const [query, setQuery] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string>();
  const [error, setError] = useState<string>();
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) navigation.replace('Login');
  }, [authLoading, isLoggedIn, navigation]);

  const loadFriends = useCallback(async () => {
    try {
      setError(undefined);
      setFriends(await getFriends());
    } catch {
      setError('Friends could not be loaded. Try again in a moment.');
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFriends();
    }, [loadFriends]),
  );

  const search = async () => {
    const searchTerm = query.trim();
    if (!searchTerm) {
      setError('Enter a name or email to search.');
      return;
    }

    try {
      setError(undefined);
      setSearching(true);
      setHasSearched(true);
      setResults(await searchUsers(searchTerm));
    } catch {
      setError('Search is unavailable right now. Please try again.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const add = async (friend: FriendProfile) => {
    try {
      setError(undefined);
      setAddingId(friend.authUserId);
      await addFriend(friend.authUserId);
      setFriends((current) =>
        [...current, friend].sort((left, right) =>
          left.displayName.localeCompare(right.displayName),
        ),
      );
      setResults((current) => current.filter((result) => result.authUserId !== friend.authUserId));
    } catch {
      setError(`${friend.displayName} could not be added. Please try again.`);
    } finally {
      setAddingId(undefined);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="friends-screen">
      <View style={styles.screen}>
        <PaperSpeckles />
        <TopBar avatarUrl={user?.avatarUrl} onLogout={logout} />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>find your people</Text>
          <Text style={styles.subtitle}>
            Search by name or email, then add someone to your circle.
          </Text>

          <View style={styles.searchRow}>
            <TextInput
              accessibilityLabel="Search for friends"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setQuery}
              onSubmitEditing={() => void search()}
              placeholder="NAME OR EMAIL"
              placeholderTextColor={COLORS.placeholder}
              returnKeyType="search"
              style={styles.searchInput}
              value={query}
            />
            <Pressable
              accessibilityRole="button"
              disabled={searching}
              onPress={() => void search()}
              style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}
            >
              {searching ? (
                <ActivityIndicator color="#fffaf5" size="small" />
              ) : (
                <Text style={styles.searchButtonText}>SEARCH</Text>
              )}
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {hasSearched ? (
            <FriendSection
              addingId={addingId}
              emptyMessage="NO NEW PEOPLE FOUND."
              friends={results}
              label="SEARCH RESULTS"
              onAdd={add}
            />
          ) : null}

          <FriendSection
            emptyMessage="NO FRIENDS YET. SEARCH ABOVE TO ADD ONE."
            friends={friends}
            label="YOUR FRIENDS"
            loading={loadingFriends}
          />
        </ScrollView>

        <BottomNavBar
          activeItem="friends"
          onCalendar={() => navigation.navigate('ScrapbookCalendarScreen')}
          onCreate={() => navigation.navigate('HangoutForm')}
          onFriends={() => undefined}
          onLogs={() => navigation.navigate('LogsScreen')}
        />
      </View>
    </SafeAreaView>
  );
}

function FriendSection({
  addingId,
  emptyMessage,
  friends,
  label,
  loading = false,
  onAdd,
}: {
  addingId?: string;
  emptyMessage: string;
  friends: FriendProfile[];
  label: string;
  loading?: boolean;
  onAdd?: (friend: FriendProfile) => Promise<void>;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {!loading ? <Text style={styles.count}>{friends.length}</Text> : null}
      </View>
      <View style={styles.friendList}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={COLORS.tealDark} size="small" />
            <Text style={styles.emptyText}>LOADING FRIENDS...</Text>
          </View>
        ) : friends.length ? (
          friends.map((friend) => (
            <View key={friend.authUserId} style={styles.friendRow}>
              {friend.avatarUrl ? (
                <Image source={{ uri: friend.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.initials}>{initials(friend.displayName)}</Text>
                </View>
              )}
              <View style={styles.friendCopy}>
                <Text style={styles.friendName}>{friend.displayName}</Text>
                <Text numberOfLines={1} style={styles.friendEmail}>
                  {friend.email}
                </Text>
              </View>
              {onAdd ? (
                <Pressable
                  accessibilityLabel={`Add ${friend.displayName}`}
                  accessibilityRole="button"
                  disabled={addingId !== undefined}
                  onPress={() => void onAdd(friend)}
                  style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
                >
                  {addingId === friend.authUserId ? (
                    <ActivityIndicator color={COLORS.primary} size="small" />
                  ) : (
                    <Text style={styles.addButtonText}>＋ ADD</Text>
                  )}
                </Pressable>
              ) : (
                <Text style={styles.friendMark}>✧</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        )}
      </View>
    </View>
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

function initials(displayName: string) {
  return displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
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
    fontFamily: FONTS.secondaryLight,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 22,
    marginTop: 3,
  },
  searchRow: { flexDirection: 'row' },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderColor: COLORS.teal,
    borderWidth: 1.5,
    color: COLORS.black,
    flex: 1,
    fontFamily: FONTS.primary,
    fontSize: 11,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    marginLeft: 6,
    minHeight: 46,
    paddingHorizontal: 16,
  },
  searchButtonText: {
    color: '#fffaf5',
    fontFamily: FONTS.primaryBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  pressed: { opacity: 0.58 },
  error: {
    backgroundColor: 'rgba(156,65,65,0.10)',
    color: COLORS.primary,
    fontFamily: FONTS.primary,
    fontSize: 10,
    marginTop: 12,
    padding: 10,
  },
  section: { marginTop: 30 },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  sectionLabel: {
    color: COLORS.text,
    fontFamily: FONTS.primaryBold,
    fontSize: 10,
    letterSpacing: 1.3,
  },
  count: { color: COLORS.primary, fontFamily: FONTS.primaryBold, fontSize: 10 },
  friendList: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderColor: COLORS.teal,
    borderWidth: 1.5,
    padding: 8,
  },
  friendRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(132,165,157,0.25)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 7,
    paddingVertical: 7,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(132,165,157,0.18)',
    borderColor: COLORS.teal,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    marginRight: 10,
    width: 40,
  },
  initials: { color: COLORS.tealDark, fontFamily: FONTS.primaryBold, fontSize: 10 },
  friendCopy: { flex: 1 },
  friendName: { color: COLORS.black, fontFamily: FONTS.secondary, fontSize: 14 },
  friendEmail: { color: COLORS.muted, fontFamily: FONTS.primary, fontSize: 9, marginTop: 2 },
  friendMark: { color: COLORS.coral, fontSize: 18, marginLeft: 8 },
  addButton: {
    alignItems: 'center',
    borderColor: COLORS.primary,
    borderWidth: 1,
    justifyContent: 'center',
    marginLeft: 8,
    minHeight: 34,
    minWidth: 62,
    paddingHorizontal: 8,
  },
  addButtonText: {
    color: COLORS.primary,
    fontFamily: FONTS.primaryBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  emptyText: {
    color: COLORS.muted,
    fontFamily: FONTS.primary,
    fontSize: 10,
    padding: 12,
  },
  loadingRow: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: 12 },
});
