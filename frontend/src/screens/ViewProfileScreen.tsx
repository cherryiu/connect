import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getHangoutsForUser, type Hangout } from '../api/hangoutsApi';
import {
  getUserLocationVisits,
  syncLocationVisits,
  type LocationVisitSummary,
} from '../api/locationApi';
import {
  getCurrentUser,
  deleteCurrentUser,
  getFriends,
  updateCurrentUser,
  type FriendProfile,
  type UserProfileResponse,
  type UserProfileUpdateRequest,
} from '../api/usersApi';
import { FONTS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { type AppColors, useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

type ProfileNavigation = NativeStackNavigationProp<RootStackParamList, 'ViewProfileScreen'>;

export default function ViewProfileScreen() {
  const navigation = useNavigation<ProfileNavigation>();
  const { isLoading: authLoading, isLoggedIn, logout, refreshAuthStatus, user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [profile, setProfile] = useState<UserProfileResponse>();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [hangouts, setHangouts] = useState<Hangout[]>([]);
  const [places, setPlaces] = useState<LocationVisitSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
    const authUserId = user.authUserId;

    const visitRequest = syncLocationVisits()
      .catch(() => undefined)
      .then(() => getUserLocationVisits(authUserId));
    const [profileResult, friendsResult, hangoutsResult, visitsResult] = await Promise.allSettled([
      getCurrentUser(),
      getFriends(),
      getHangoutsForUser(authUserId),
      visitRequest,
    ]);

    if (profileResult.status === 'fulfilled') setProfile(profileResult.value);
    if (friendsResult.status === 'fulfilled') setFriends(friendsResult.value);
    if (hangoutsResult.status === 'fulfilled') setHangouts(hangoutsResult.value);
    if (visitsResult.status === 'fulfilled') setPlaces(visitsResult.value);

    const failed = [profileResult, friendsResult, hangoutsResult, visitsResult].some(
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

  const saveProfile = async (request: UserProfileUpdateRequest) => {
    const updated = await updateCurrentUser(request);
    setProfile(updated);
    await refreshAuthStatus();
  };

  const uploadAvatar = async () => {
    if (!profile) return;
    const selectedImage = await selectProfileImage();
    if (!selectedImage) return;
    try {
      setError(undefined);
      setUploadingAvatar(true);
      await saveProfile({
        avatarUrl: selectedImage,
        bio: profile.bio,
        displayName: profile.displayName,
        email: profile.email,
        role: 'USER',
      });
    } catch {
      setError('Your profile picture could not be updated. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
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
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryRow}>
            <Pressable
              accessibilityHint="Opens your photo library"
              accessibilityLabel="Change profile picture"
              accessibilityRole="button"
              disabled={loading || uploadingAvatar}
              onPress={() => void uploadAvatar()}
              style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={[colors.yellow, colors.coral, colors.teal]}
                  end={{ x: 1, y: 1 }}
                  start={{ x: 0, y: 0 }}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{initials(displayName)}</Text>
                </LinearGradient>
              )}
              <View style={styles.avatarEditBadge}>
                {uploadingAvatar ? (
                  <ActivityIndicator color={colors.surface} size="small" />
                ) : (
                  <Text style={styles.avatarEditBadgeText}>＋</Text>
                )}
              </View>
            </Pressable>

            <View style={styles.stats}>
              <Text style={styles.statsTitle}>Stats</Text>
              {loading ? (
                <ActivityIndicator color={colors.tealDark} size="small" style={styles.loader} />
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

          <PlacesVisitedBox
            loading={loading}
            onPress={() => navigation.navigate('LogsScreen')}
            places={places}
          />

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
              accessibilityRole="button"
              onPress={() => setEditProfileVisible(true)}
              style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryActionText}>EDIT PROFILE</Text>
            </Pressable>
          </View>

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

        {editProfileVisible && profile ? (
          <EditProfileModal
            onClose={() => setEditProfileVisible(false)}
            onSave={async (request) => {
              await saveProfile(request);
              setEditProfileVisible(false);
            }}
            profile={profile}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function EditProfileModal({
  onClose,
  onSave,
  profile,
}: {
  onClose: () => void;
  onSave: (request: UserProfileUpdateRequest) => Promise<void>;
  profile: UserProfileResponse;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const choosePhoto = async () => {
    const selectedImage = await selectProfileImage();
    if (selectedImage) setAvatarUrl(selectedImage);
  };

  const submit = async () => {
    if (!displayName.trim()) {
      setError('DISPLAY NAME IS REQUIRED.');
      return;
    }
    try {
      setError(undefined);
      setSaving(true);
      await onSave({
        avatarUrl,
        bio: bio.trim() || undefined,
        displayName: displayName.trim(),
        email: profile.email,
        role: 'USER',
      });
    } catch {
      setError('YOUR PROFILE COULD NOT BE SAVED.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <Pressable
        accessibilityLabel="Close profile editor"
        onPress={onClose}
        style={styles.editorBackdrop}
      >
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.editorCard}>
          <Text style={styles.editorTitle}>EDIT PROFILE</Text>

          <Pressable
            accessibilityLabel="Choose a profile picture"
            accessibilityRole="button"
            onPress={() => void choosePhoto()}
            style={({ pressed }) => [styles.editorAvatarButton, pressed && styles.pressed]}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.editorAvatar} />
            ) : (
              <LinearGradient
                colors={[colors.yellow, colors.coral, colors.teal]}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={styles.editorAvatar}
              >
                <Text style={styles.editorAvatarText}>{initials(displayName)}</Text>
              </LinearGradient>
            )}
            <Text style={styles.changePhotoText}>CHANGE PHOTO</Text>
          </Pressable>

          <Text style={styles.editorInputLabel}>DISPLAY NAME</Text>
          <TextInput
            maxLength={80}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={colors.placeholder}
            style={styles.editorInput}
            value={displayName}
          />

          <Text style={styles.editorInputLabel}>BIO</Text>
          <TextInput
            maxLength={500}
            multiline
            onChangeText={setBio}
            placeholder="Tell your friends about yourself"
            placeholderTextColor={colors.placeholder}
            style={[styles.editorInput, styles.editorBioInput]}
            textAlignVertical="top"
            value={bio}
          />

          {error ? <Text style={styles.editorError}>{error}</Text> : null}
          <View style={styles.editorActions}>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={onClose}
              style={({ pressed }) => [styles.editorCancel, pressed && styles.pressed]}
            >
              <Text style={styles.editorCancelText}>CANCEL</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => void submit()}
              style={({ pressed }) => [styles.editorSave, pressed && styles.pressed]}
            >
              {saving ? (
                <ActivityIndicator color={colors.surface} size="small" />
              ) : (
                <Text style={styles.editorSaveText}>SAVE PROFILE</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

async function selectProfileImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Photo access needed',
      'Allow photo library access in Settings to choose a profile picture.',
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    base64: true,
    mediaTypes: ['images'],
    quality: 0.55,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset?.base64) {
    Alert.alert('Photo unavailable', 'This photo could not be read. Please choose another one.');
    return null;
  }
  const supportedMimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(asset.mimeType ?? '')
    ? asset.mimeType
    : 'image/jpeg';
  const dataUri = `data:${supportedMimeType};base64,${asset.base64}`;
  if (dataUri.length > 4_000_000) {
    Alert.alert('Photo too large', 'Choose a smaller photo and try again.');
    return null;
  }
  return dataUri;
}

function PlacesVisitedBox({
  loading,
  onPress,
  places,
}: {
  loading: boolean;
  onPress: () => void;
  places: LocationVisitSummary[];
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const totalVisits = places.reduce((total, place) => total + place.visitCount, 0);

  return (
    <Pressable
      accessibilityHint="Opens your visited place logs"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.placesBox, pressed && styles.pressed]}
    >
      <View>
        <Text style={styles.placesLabel}>PLACES VISITED</Text>
        {loading ? (
          <ActivityIndicator color={colors.tealDark} size="small" style={styles.placesLoader} />
        ) : (
          <Text style={styles.placesCount}>
            {places.length} {places.length === 1 ? 'place' : 'places'} · {totalVisits}{' '}
            {totalVisits === 1 ? 'visit' : 'visits'}
          </Text>
        )}
      </View>
      <Text style={styles.placesArrow}>→</Text>
    </Pressable>
  );
}

function FriendsPanel({ friends }: { friends: FriendProfile[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safeArea: { backgroundColor: colors.background, flex: 1 },
    screen: { backgroundColor: colors.background, flex: 1 },
    speckles: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
    speck: {
      backgroundColor: colors.coral,
      height: 1,
      opacity: 0.16,
      position: 'absolute',
      width: 3,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderBottomColor: colors.teal,
      borderBottomWidth: 1,
      flexDirection: 'row',
      height: 66,
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    back: { color: colors.primary, fontSize: 38, lineHeight: 40 },
    headerTitle: {
      color: colors.primary,
      fontFamily: FONTS.primaryBold,
      fontSize: 16,
      letterSpacing: 1.2,
    },
    headerSpacer: { width: 22 },
    content: { paddingBottom: 64, paddingHorizontal: 22, paddingTop: 32 },
    summaryRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 18 },
    avatarButton: { marginRight: 18, position: 'relative' },
    avatar: {
      alignItems: 'center',
      borderColor: 'rgba(255,255,255,0.65)',
      borderRadius: 50,
      borderWidth: 1,
      height: 100,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 100,
    },
    avatarText: { color: '#fff', fontFamily: FONTS.secondaryLight, fontSize: 40 },
    avatarEditBadge: {
      alignItems: 'center',
      backgroundColor: colors.tealDark,
      borderColor: colors.background,
      borderRadius: 15,
      borderWidth: 2,
      bottom: 0,
      height: 30,
      justifyContent: 'center',
      position: 'absolute',
      right: 0,
      width: 30,
    },
    avatarEditBadgeText: {
      color: colors.surface,
      fontFamily: FONTS.primaryBold,
      fontSize: 18,
      lineHeight: 20,
    },
    stats: { flex: 1 },
    statsTitle: {
      color: colors.black,
      fontFamily: FONTS.primaryBold,
      fontSize: 14,
      letterSpacing: 0.5,
      marginBottom: 7,
    },
    statLine: { color: colors.text, fontFamily: FONTS.primary, fontSize: 11, lineHeight: 18 },
    loader: { alignSelf: 'flex-start', marginTop: 8 },
    name: {
      color: colors.black,
      fontFamily: FONTS.secondaryBold,
      fontSize: 38,
      lineHeight: 42,
      textTransform: 'lowercase',
    },
    bio: {
      color: colors.text,
      fontFamily: FONTS.secondaryLight,
      fontSize: 16,
      lineHeight: 23,
      marginBottom: 28,
      marginTop: 3,
    },
    placesBox: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.tealDark,
      borderWidth: 1.5,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 22,
      minHeight: 76,
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    placesLabel: {
      color: colors.tealDark,
      fontFamily: FONTS.primaryBold,
      fontSize: 10,
      letterSpacing: 1,
    },
    placesCount: {
      color: colors.black,
      fontFamily: FONTS.secondary,
      fontSize: 15,
      marginTop: 6,
    },
    placesLoader: { alignSelf: 'flex-start', marginTop: 7 },
    placesArrow: { color: colors.primary, fontFamily: FONTS.primary, fontSize: 24 },
    error: {
      backgroundColor: 'rgba(156,65,65,0.10)',
      color: colors.primary,
      fontFamily: FONTS.primary,
      fontSize: 10,
      marginBottom: 14,
      padding: 10,
    },
    actions: { flexDirection: 'row' },
    primaryAction: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      borderWidth: 1.5,
      flex: 1,
      justifyContent: 'center',
      minHeight: 46,
      paddingHorizontal: 8,
    },
    secondaryAction: {
      alignItems: 'center',
      borderColor: colors.primary,
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
      color: colors.text,
      fontFamily: FONTS.primaryBold,
      fontSize: 10,
      letterSpacing: 0.7,
      textAlign: 'center',
    },
    pressed: { opacity: 0.58 },
    editorBackdrop: {
      alignItems: 'center',
      backgroundColor: 'rgba(20,17,15,0.48)',
      flex: 1,
      justifyContent: 'center',
      padding: 18,
    },
    editorCard: {
      backgroundColor: colors.surface,
      borderColor: colors.tealDark,
      borderRadius: 12,
      borderWidth: 1.5,
      maxWidth: 430,
      padding: 18,
      width: '100%',
    },
    editorTitle: {
      color: colors.black,
      fontFamily: FONTS.primaryBold,
      fontSize: 13,
      letterSpacing: 0.9,
      marginBottom: 14,
    },
    editorAvatarButton: { alignItems: 'center', alignSelf: 'center', marginBottom: 18 },
    editorAvatar: {
      alignItems: 'center',
      borderColor: colors.teal,
      borderRadius: 42,
      borderWidth: 1.5,
      height: 84,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 84,
    },
    editorAvatarText: { color: '#fff', fontFamily: FONTS.secondaryLight, fontSize: 32 },
    changePhotoText: {
      color: colors.tealDark,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      letterSpacing: 0.6,
      marginTop: 7,
    },
    editorInputLabel: {
      color: colors.tealDark,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      letterSpacing: 0.7,
      marginBottom: 6,
    },
    editorInput: {
      backgroundColor: colors.background,
      borderColor: colors.teal,
      borderWidth: 1,
      color: colors.black,
      fontFamily: FONTS.secondaryLight,
      fontSize: 15,
      marginBottom: 14,
      minHeight: 44,
      paddingHorizontal: 11,
      paddingVertical: 9,
    },
    editorBioInput: { minHeight: 92 },
    editorError: {
      color: colors.primary,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      marginBottom: 10,
    },
    editorActions: { flexDirection: 'row', gap: 8 },
    editorCancel: {
      alignItems: 'center',
      borderColor: colors.mutedBorder,
      borderRadius: 20,
      borderWidth: 1,
      flex: 1,
      justifyContent: 'center',
      minHeight: 42,
    },
    editorCancelText: {
      color: colors.muted,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      letterSpacing: 0.6,
    },
    editorSave: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 20,
      flex: 1,
      justifyContent: 'center',
      minHeight: 42,
    },
    editorSaveText: {
      color: colors.surface,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      letterSpacing: 0.6,
    },
    friendsSection: { marginTop: 30 },
    sectionLabel: {
      color: colors.text,
      fontFamily: FONTS.primaryBold,
      fontSize: 10,
      letterSpacing: 1.3,
      marginBottom: 7,
    },
    friendList: {
      backgroundColor: colors.surface,
      borderColor: colors.teal,
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
      borderColor: colors.teal,
      borderRadius: 18,
      borderWidth: 1,
      height: 36,
      justifyContent: 'center',
      marginRight: 10,
      width: 36,
    },
    friendInitials: { color: colors.tealDark, fontFamily: FONTS.primary, fontSize: 10 },
    friendCopy: { flex: 1 },
    friendName: { color: colors.black, fontFamily: FONTS.secondary, fontSize: 14 },
    friendEmail: { color: colors.muted, fontFamily: FONTS.primary, fontSize: 9, marginTop: 2 },
    friendMark: { color: colors.coral, fontSize: 18, marginLeft: 8 },
    emptyFriends: { color: colors.muted, fontFamily: FONTS.primary, fontSize: 10, padding: 12 },
    deleteAccount: { alignItems: 'center', marginTop: 34, paddingVertical: 12 },
    deleteAccountText: {
      color: colors.primary,
      fontFamily: FONTS.primaryBold,
      fontSize: 10,
      letterSpacing: 0.8,
    },
  });
}
