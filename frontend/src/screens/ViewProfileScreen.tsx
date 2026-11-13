import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getHangoutsForUser, type Hangout } from '../api/hangoutsApi';
import {
  getCurrentUser,
  deleteCurrentUser,
  getFriends,
  type FriendProfile,
  type UserProfileResponse,
} from '../api/usersApi';
import { COLORS, FONTS } from '../constants';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

type ProfileNavigation = NativeStackNavigationProp<RootStackParamList, 'ViewProfileScreen'>;

export default function ViewProfileScreen() {
  const navigation = useNavigation<ProfileNavigation>();
  const { isLoading: authLoading, isLoggedIn, logout, user } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponse>();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [hangouts, setHangouts] = useState<Hangout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [editMessageVisible, setEditMessageVisible] = useState(false);
  const [error, setError] = useState<string>();
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) navigation.replace('Login');
  }, [authLoading, isLoggedIn, navigation]);

  const loadProfile = useCallback(async () => {
    if (!user?.authUserId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const [profileResult, friendsResult, hangoutsResult] = await Promise.allSettled([
      getCurrentUser(),
      getFriends(),
      getHangoutsForUser(user.authUserId),
    ]);

    if (profileResult.status === 'fulfilled') setProfile(profileResult.value);
    if (friendsResult.status === 'fulfilled') setFriends(friendsResult.value);
    if (hangoutsResult.status === 'fulfilled') setHangouts(hangoutsResult.value);

    const failed = [profileResult, friendsResult, hangoutsResult].some(
      (result) => result.status === 'rejected',
    );
    setError(failed ? 'Some profile details could not be refreshed.' : undefined);
    setLoading(false);
    setRefreshing(false);
  }, [user?.authUserId]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const stats = useMemo(() => {
    const now = Date.now();
    const participatingHangouts = hangouts.filter(
      (hangout) => user?.authUserId && hangout.participantAuthUserIds.includes(user.authUserId),
    );
    return {
      attended: participatingHangouts.filter((hangout) => Date.parse(hangout.endTime) < now).length,
      // New hangouts put their creator first in participantAuthUserIds.
      created: participatingHangouts.filter(
        (hangout) => hangout.participantAuthUserIds[0] === user?.authUserId,
      ).length,
    };
  }, [hangouts, user?.authUserId]);

  const displayName = profile?.displayName || user?.displayName || 'your profile';
  const avatarUrl = profile?.avatarUrl || user?.avatarUrl;
  const bio = profile?.bio?.trim() || 'Add a little something about yourself.';

  const deleteAccount = async () => {
    try {
      setError(undefined);
      setDeletingAccount(true);
      await deleteCurrentUser();
      await logout();
      navigation.replace('Login');
    } catch {
      setError('Your account could not be deleted. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const confirmAccountDeletion = () => {
    Alert.alert('Delete account?', 'Your profile will be permanently deleted.', [
      { style: 'cancel', text: 'Cancel' },
      { style: 'destructive', text: 'Delete', onPress: () => void deleteAccount() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="profile-screen">
      <View style={styles.screen}>
        <PaperSpeckles />

        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Back"
            hitSlop={10}
            onPress={() => navigation.goBack()}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>PROFILE</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                setRefreshing(true);
                void loadProfile();
              }}
              refreshing={refreshing}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryRow}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[COLORS.yellow, '#f7a7c6', '#b8b8ff']}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{initials(displayName)}</Text>
              </LinearGradient>
            )}

            <View style={styles.stats}>
              <Text style={styles.statsTitle}>Stats</Text>
              {loading ? (
                <ActivityIndicator color={COLORS.tealDark} size="small" style={styles.loader} />
              ) : (
                <>
                  <Text style={styles.statLine}>{stats.attended} hangs attended</Text>
                  <Text style={styles.statLine}>{stats.created} hangs created</Text>
                  <Text style={styles.statLine}>{friends.length} friends</Text>
                </>
              )}
            </View>
          </View>

          <Text numberOfLines={2} style={styles.name}>
            {displayName}
          </Text>
          <Text style={styles.bio}>{bio}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowFriends((visible) => !visible)}
              style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
            >
              <Text style={styles.primaryActionText}>
                {showFriends ? 'HIDE FRIENDS' : 'SEE ALL FRIENDS'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityHint="Shows the placeholder for the upcoming edit profile flow"
              accessibilityRole="button"
              onPress={() => setEditMessageVisible((visible) => !visible)}
              style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryActionText}>EDIT PROFILE</Text>
            </Pressable>
          </View>

          {editMessageVisible ? (
            <Text style={styles.editMessage}>PROFILE EDITING CAN BE CONNECTED HERE NEXT.</Text>
          ) : null}

          {showFriends ? <FriendsPanel friends={friends} /> : null}

          <Pressable
            accessibilityRole="button"
            disabled={deletingAccount}
            onPress={confirmAccountDeletion}
            style={({ pressed }) => [styles.deleteAccount, pressed && styles.pressed]}
          >
            <Text style={styles.deleteAccountText}>
              {deletingAccount ? 'DELETING ACCOUNT...' : 'DELETE ACCOUNT'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function FriendsPanel({ friends }: { friends: FriendProfile[] }) {
  return (
    <View style={styles.friendsSection}>
      <Text style={styles.sectionLabel}>FRIENDS</Text>
      <View style={styles.friendList}>
        {friends.length ? (
          friends.map((friend) => (
            <View key={friend.authUserId} style={styles.friendRow}>
              <View style={styles.friendAvatar}>
                <Text style={styles.friendInitials}>{initials(friend.displayName)}</Text>
              </View>
              <View style={styles.friendCopy}>
                <Text style={styles.friendName}>{friend.displayName}</Text>
                <Text numberOfLines={1} style={styles.friendEmail}>
                  {friend.email}
                </Text>
              </View>
              <Text style={styles.friendMark}>✧</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyFriends}>NO FRIENDS TO SHOW YET.</Text>
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
  return (
    displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#fbf5ef', flex: 1 },
  screen: { backgroundColor: '#fbf5ef', flex: 1 },
  speckles: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  speck: { backgroundColor: 'rgba(156, 65, 65, 0.16)', height: 1, position: 'absolute', width: 3 },
  header: {
    alignItems: 'center',
    backgroundColor: 'rgba(251,245,239,0.94)',
    borderBottomColor: COLORS.teal,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 66,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  back: { color: COLORS.primary, fontSize: 38, lineHeight: 40 },
  headerTitle: {
    color: COLORS.primary,
    fontFamily: FONTS.primaryBold,
    fontSize: 16,
    letterSpacing: 1.2,
  },
  headerSpacer: { width: 22 },
  content: { paddingBottom: 64, paddingHorizontal: 22, paddingTop: 32 },
  summaryRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 18 },
  avatar: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.65)',
    borderRadius: 50,
    borderWidth: 1,
    height: 100,
    justifyContent: 'center',
    marginRight: 18,
    overflow: 'hidden',
    width: 100,
  },
  avatarText: { color: '#fff', fontFamily: FONTS.secondaryLight, fontSize: 40 },
  stats: { flex: 1 },
  statsTitle: {
    color: COLORS.black,
    fontFamily: FONTS.primaryBold,
    fontSize: 14,
    letterSpacing: 0.5,
    marginBottom: 7,
  },
  statLine: { color: COLORS.text, fontFamily: FONTS.primary, fontSize: 11, lineHeight: 18 },
  loader: { alignSelf: 'flex-start', marginTop: 8 },
  name: {
    color: COLORS.black,
    fontFamily: FONTS.secondaryBold,
    fontSize: 38,
    lineHeight: 42,
    textTransform: 'lowercase',
  },
  bio: {
    color: COLORS.text,
    fontFamily: FONTS.secondaryLight,
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 28,
    marginTop: 3,
  },
  error: {
    backgroundColor: 'rgba(156,65,65,0.10)',
    color: COLORS.primary,
    fontFamily: FONTS.primary,
    fontSize: 10,
    marginBottom: 14,
    padding: 10,
  },
  actions: { flexDirection: 'row' },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 8,
  },
  secondaryAction: {
    alignItems: 'center',
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    flex: 1,
    justifyContent: 'center',
    marginLeft: 6,
    minHeight: 46,
    paddingHorizontal: 8,
  },
  primaryActionText: {
    color: '#fffaf5',
    fontFamily: FONTS.primaryBold,
    fontSize: 10,
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  secondaryActionText: {
    color: COLORS.text,
    fontFamily: FONTS.primaryBold,
    fontSize: 10,
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  pressed: { opacity: 0.58 },
  editMessage: {
    color: COLORS.muted,
    fontFamily: FONTS.primary,
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 10,
    textAlign: 'right',
  },
  friendsSection: { marginTop: 30 },
  sectionLabel: {
    color: COLORS.text,
    fontFamily: FONTS.primaryBold,
    fontSize: 10,
    letterSpacing: 1.3,
    marginBottom: 7,
  },
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
    minHeight: 54,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  friendAvatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(132,165,157,0.18)',
    borderColor: COLORS.teal,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginRight: 10,
    width: 36,
  },
  friendInitials: { color: COLORS.tealDark, fontFamily: FONTS.primary, fontSize: 10 },
  friendCopy: { flex: 1 },
  friendName: { color: COLORS.black, fontFamily: FONTS.secondary, fontSize: 14 },
  friendEmail: { color: COLORS.muted, fontFamily: FONTS.primary, fontSize: 9, marginTop: 2 },
  friendMark: { color: COLORS.coral, fontSize: 18, marginLeft: 8 },
  emptyFriends: { color: COLORS.muted, fontFamily: FONTS.primary, fontSize: 10, padding: 12 },
  deleteAccount: { alignItems: 'center', marginTop: 34, paddingVertical: 12 },
  deleteAccountText: {
    color: COLORS.primary,
    fontFamily: FONTS.primaryBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
});
