import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  confirmLocationVisitAttendance,
  createStandaloneLocationOrder,
  deleteLocationVisit,
  deleteStandaloneLocationOrder,
  getLocationVisitHistory,
  updateLocationVisitJournal,
  updateStandaloneLocationOrder,
  type LocationVisitDetail,
} from '../api/locationApi';
import { getFriends, type FriendProfile } from '../api/usersApi';
import { FONTS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { type AppColors, useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

type HistoryNavigation = NativeStackNavigationProp<RootStackParamList, 'PlaceHistoryScreen'>;
type HistoryRoute = RouteProp<RootStackParamList, 'PlaceHistoryScreen'>;

export default function PlaceHistoryScreen() {
  const navigation = useNavigation<HistoryNavigation>();
  const route = useRoute<HistoryRoute>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isLoading: authLoading, isLoggedIn, user } = useAuth();
  const [visits, setVisits] = useState<LocationVisitDetail[]>([]);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [orderDescription, setOrderDescription] = useState('');
  const [orderRating, setOrderRating] = useState<number>();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>();
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string>();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) navigation.replace('Login');
  }, [authLoading, isLoggedIn, navigation]);

  const loadHistory = useCallback(async () => {
    if (!user?.authUserId) {
      setLoading(false);
      return;
    }

    try {
      setError(undefined);
      const [historyResult, friendsResult] = await Promise.allSettled([
        getLocationVisitHistory(user.authUserId, route.params.place.location),
        getFriends(),
      ]);
      if (historyResult.status === 'rejected') throw historyResult.reason;
      setVisits(historyResult.value);
      if (friendsResult.status === 'fulfilled') setFriends(friendsResult.value);
    } catch {
      setError('This visit history could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [route.params.place.location, user?.authUserId]);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const friendsById = useMemo(
    () => new Map(friends.map((friend) => [friend.authUserId, friend])),
    [friends],
  );

  const editingVisit = useMemo(
    () => visits.find((visit) => visit.entryId === editingEntryId),
    [editingEntryId, visits],
  );
  const visitCount = loading
    ? route.params.place.visitCount
    : visits.filter((visit) => !visit.standaloneOrder).length;

  useEffect(() => {
    if (!route.params.editHangoutId || editingEntryId) return;
    const requestedVisit = visits.find(
      (visit) => visit.authHangoutId === route.params.editHangoutId,
    );
    if (requestedVisit) {
      setEditingEntryId(requestedVisit.entryId);
      navigation.setParams({ editHangoutId: undefined });
    }
  }, [editingEntryId, navigation, route.params.editHangoutId, visits]);

  useEffect(() => {
    if (!editingVisit) return;
    setOrderDescription(editingVisit.orderDescription ?? '');
    setOrderRating(editingVisit.orderRating ?? undefined);
    setNotes(editingVisit.notes ?? '');
  }, [editingVisit]);

  const saveJournal = async () => {
    if (!user?.authUserId) return;
    if (!orderDescription.trim()) {
      setSaveMessage('ADD WHAT YOU ORDERED BEFORE SAVING.');
      return;
    }
    try {
      setSaveMessage(undefined);
      setSaving(true);
      if (creatingOrder) {
        const created = await createStandaloneLocationOrder(user.authUserId, {
          location: route.params.place.location,
          notes,
          orderDescription,
          orderRating,
        });
        setVisits((current) =>
          [created, ...current].sort(
            (left, right) => Date.parse(right.visitedAt) - Date.parse(left.visitedAt),
          ),
        );
        setCreatingOrder(false);
      } else if (editingVisit?.standaloneOrder) {
        const updated = await updateStandaloneLocationOrder(user.authUserId, editingVisit.entryId, {
          notes,
          orderDescription,
          orderRating,
        });
        setVisits((current) =>
          current.map((entry) => (entry.entryId === updated.entryId ? updated : entry)),
        );
        setEditingEntryId(undefined);
      } else if (editingVisit?.authHangoutId) {
        const updated = await updateLocationVisitJournal(
          user.authUserId,
          editingVisit.authHangoutId,
          { notes, orderDescription, orderRating },
        );
        await confirmLocationVisitAttendance(user.authUserId, editingVisit.authHangoutId, true);
        setVisits((current) =>
          current.map((visit) =>
            visit.entryId === updated.entryId ? { ...updated, attendanceConfirmed: true } : visit,
          ),
        );
        setEditingEntryId(undefined);
        navigation.setParams({ editHangoutId: undefined });
      }
    } catch {
      setSaveMessage('VISIT DETAILS COULD NOT BE SAVED.');
    } finally {
      setSaving(false);
    }
  };

  const openStandaloneOrderEditor = () => {
    navigation.setParams({ editHangoutId: undefined });
    setEditingEntryId(undefined);
    setOrderDescription('');
    setOrderRating(undefined);
    setNotes('');
    setSaveMessage(undefined);
    setCreatingOrder(true);
  };

  const openEntryEditor = (visit: LocationVisitDetail) => {
    navigation.setParams({ editHangoutId: undefined });
    setCreatingOrder(false);
    setSaveMessage(undefined);
    setEditingEntryId(visit.entryId);
  };

  const closeEditor = () => {
    if (saving || deleting) return;
    navigation.setParams({ editHangoutId: undefined });
    setCreatingOrder(false);
    setEditingEntryId(undefined);
    setSaveMessage(undefined);
  };

  const deleteEntry = async () => {
    if (!user?.authUserId || !editingVisit) return;
    try {
      setSaveMessage(undefined);
      setDeleting(true);
      if (editingVisit.standaloneOrder) {
        await deleteStandaloneLocationOrder(user.authUserId, editingVisit.entryId);
      } else if (editingVisit.authHangoutId) {
        await deleteLocationVisit(user.authUserId, editingVisit.authHangoutId);
      }
      setVisits((current) => current.filter((visit) => visit.entryId !== editingVisit.entryId));
      setEditingEntryId(undefined);
      navigation.setParams({ editHangoutId: undefined });
    } catch {
      setSaveMessage('THIS ENTRY COULD NOT BE DELETED.');
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteEntry = () => {
    if (!editingVisit) return;
    const entryName = editingVisit.standaloneOrder ? 'order' : 'visit';
    Alert.alert(
      `Delete ${entryName}?`,
      `This will permanently remove this ${entryName} from your history.`,
      [
        { style: 'cancel', text: 'Cancel' },
        { onPress: () => void deleteEntry(), style: 'destructive', text: 'Delete' },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="place-history-screen">
      <View style={styles.screen}>
        <PaperSpeckles />
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Back to places visited"
            hitSlop={10}
            onPress={() => navigation.goBack()}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>VISIT HISTORY</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{route.params.place.location}</Text>
          <Text style={styles.subtitle}>
            {visitCount} {visitCount === 1 ? 'visit' : 'visits'} · newest first
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={colors.tealDark} />
              <Text style={styles.loadingText}>LOADING VISIT HISTORY...</Text>
            </View>
          ) : visits.length ? (
            <View style={styles.visitList}>
              {visits.map((visit) => (
                <VisitCard
                  friendsById={friendsById}
                  key={visit.entryId}
                  onPress={() => openEntryEditor(visit)}
                  visit={visit}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>NO VISITS FOUND</Text>
              <Text style={styles.emptyCopy}>Pull down your logs again to refresh this place.</Text>
            </View>
          )}
        </ScrollView>
        <Modal
          animationType="fade"
          onRequestClose={closeEditor}
          transparent
          visible={Boolean(editingVisit || creatingOrder)}
        >
          <Pressable
            accessibilityLabel="Close order editor"
            onPress={closeEditor}
            style={styles.editorBackdrop}
          >
            <Pressable onPress={(event) => event.stopPropagation()} style={styles.editorModal}>
              <VisitEditor
                deleting={deleting}
                notes={notes}
                onChangeNotes={setNotes}
                onChangeOrder={setOrderDescription}
                onChangeRating={setOrderRating}
                onDelete={editingVisit ? confirmDeleteEntry : undefined}
                onSave={() => void saveJournal()}
                orderDescription={orderDescription}
                orderRating={orderRating}
                saveLabel={
                  creatingOrder || editingVisit?.standaloneOrder ? 'SAVE ORDER' : 'SAVE VISIT'
                }
                saveMessage={saveMessage}
                saving={saving}
                title={
                  creatingOrder
                    ? '✧ ADD AN ORDER'
                    : editingVisit?.standaloneOrder
                      ? '✧ EDIT ORDER'
                      : '✧ ADD VISIT DETAILS'
                }
              />
            </Pressable>
          </Pressable>
        </Modal>
        {!editingVisit && !creatingOrder ? (
          <Pressable
            accessibilityLabel="Add an order without a visit"
            accessibilityRole="button"
            onPress={openStandaloneOrderEditor}
            style={({ pressed }) => [styles.addOrderButton, pressed && styles.pressed]}
          >
            <View aria-hidden style={styles.plusIcon}>
              <View style={styles.plusHorizontal} />
              <View style={styles.plusVertical} />
            </View>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function VisitEditor({
  deleting,
  notes,
  onChangeNotes,
  onChangeOrder,
  onChangeRating,
  onDelete,
  onSave,
  orderDescription,
  orderRating,
  saveLabel,
  saveMessage,
  saving,
  title,
}: {
  deleting: boolean;
  notes: string;
  onChangeNotes: (value: string) => void;
  onChangeOrder: (value: string) => void;
  onChangeRating: (value: number) => void;
  onDelete?: () => void;
  onSave: () => void;
  orderDescription: string;
  orderRating?: number;
  saveLabel: string;
  saveMessage?: string;
  saving: boolean;
  title: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.editor}>
      <Text style={styles.editorKicker}>{title}</Text>
      <Text style={styles.inputLabel}>WHAT DID YOU ORDER?</Text>
      <TextInput
        maxLength={500}
        onChangeText={onChangeOrder}
        placeholder="iced latte, fries, pasta..."
        placeholderTextColor={colors.placeholder}
        style={styles.input}
        value={orderDescription}
      />

      <Text style={styles.inputLabel}>RATE YOUR ORDER</Text>
      <View accessibilityRole="radiogroup" style={styles.ratingPicker}>
        {Array.from({ length: 5 }, (_, index) => {
          const value = index + 1;
          const selected = value <= (orderRating ?? 0);
          return (
            <Pressable
              accessibilityLabel={`${value} star${value === 1 ? '' : 's'}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: orderRating === value }}
              key={value}
              onPress={() => onChangeRating(value)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={[styles.ratingPickerStar, !selected && styles.ratingPickerStarEmpty]}>
                ★
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.inputLabel}>NOTES</Text>
      <TextInput
        maxLength={1000}
        multiline
        onChangeText={onChangeNotes}
        placeholder="what should you remember for next time?"
        placeholderTextColor={colors.placeholder}
        style={[styles.input, styles.notesInput]}
        textAlignVertical="top"
        value={notes}
      />

      {saveMessage ? <Text style={styles.saveMessage}>{saveMessage}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={saving || deleting}
        onPress={onSave}
        style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
      >
        {saving ? (
          <ActivityIndicator color={colors.surface} size="small" />
        ) : (
          <Text style={styles.saveButtonText}>{saveLabel}</Text>
        )}
      </Pressable>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          disabled={saving || deleting}
          onPress={onDelete}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
        >
          {deleting ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.deleteButtonText}>DELETE FROM HISTORY</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function VisitCard({
  friendsById,
  onPress,
  visit,
}: {
  friendsById: Map<string, FriendProfile>;
  onPress: () => void;
  visit: LocationVisitDetail;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const companions = visit.companionAuthUserIds.map((authUserId, index) => {
    const friend = friendsById.get(authUserId);
    return {
      authUserId,
      avatarUrl: friend?.avatarUrl,
      displayName: friend?.displayName ?? `friend ${index + 1}`,
    };
  });
  const order = visit.orderDescription?.trim();
  const notes = visit.notes?.trim();

  return (
    <Pressable
      accessibilityHint="Opens this order for editing"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.visitCard, pressed && styles.pressed]}
    >
      <Text style={styles.dateBadge}>{formatVisitDate(visit.visitedAt)}</Text>

      <Text style={[styles.order, !order && styles.placeholderCopy]}>
        {order || 'No order noted'}
      </Text>
      <OrderRating rating={visit.orderRating} />

      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>
        {visit.standaloneOrder ? 'ORDER ONLY' : 'WHO YOU WENT WITH'}
      </Text>
      {visit.standaloneOrder ? (
        <Text style={styles.companionNames}>Not linked to a hangout visit.</Text>
      ) : companions.length ? (
        <View style={styles.companionRow}>
          <View style={styles.avatarStack}>
            {companions.slice(0, 4).map((companion, index) =>
              companion.avatarUrl ? (
                <Image
                  key={companion.authUserId}
                  source={{ uri: companion.avatarUrl }}
                  style={[styles.avatar, index > 0 && styles.avatarOverlap]}
                />
              ) : (
                <View
                  key={companion.authUserId}
                  style={[styles.avatar, styles.avatarFallback, index > 0 && styles.avatarOverlap]}
                >
                  <Text style={styles.avatarInitials}>{initials(companion.displayName)}</Text>
                </View>
              ),
            )}
          </View>
          <Text style={styles.companionNames}>
            {companions.map((companion) => companion.displayName).join(' + ')}
          </Text>
        </View>
      ) : (
        <Text style={styles.companionNames}>Just you</Text>
      )}

      <View style={styles.notesBox}>
        <Text style={styles.notesLabel}>NOTES</Text>
        <Text style={[styles.notes, !notes && styles.placeholderCopy]}>
          {notes || 'No notes added yet.'}
        </Text>
      </View>
    </Pressable>
  );
}

function OrderRating({ rating }: { rating?: number | null }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!rating) return <Text style={styles.unrated}>NOT RATED</Text>;

  const normalizedRating = Math.min(5, Math.max(1, Math.round(rating)));
  return (
    <Text
      accessibilityLabel={`Order rated ${normalizedRating} out of 5 stars`}
      style={styles.rating}
    >
      <Text style={styles.ratingStars}>
        {'★'.repeat(normalizedRating)}
        <Text style={styles.emptyStars}>{'★'.repeat(5 - normalizedRating)}</Text>
      </Text>{' '}
      {normalizedRating} / 5
    </Text>
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

function formatVisitDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'DATE UNKNOWN';
  return date
    .toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase();
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
      fontSize: 14,
      letterSpacing: 1.2,
    },
    headerSpacer: { width: 22 },
    pressed: { opacity: 0.55 },
    content: { paddingBottom: 110, paddingHorizontal: 18, paddingTop: 28 },
    addOrderButton: {
      alignItems: 'center',
      backgroundColor: colors.tealSoft,
      borderColor: colors.teal,
      borderRadius: 24,
      borderWidth: 1.5,
      bottom: 18,
      height: 48,
      justifyContent: 'center',
      position: 'absolute',
      right: 18,
      shadowColor: colors.black,
      shadowOffset: { height: 2, width: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      width: 48,
    },
    plusIcon: { alignItems: 'center', height: 18, justifyContent: 'center', width: 18 },
    plusHorizontal: {
      backgroundColor: colors.tealDark,
      borderRadius: 1,
      height: 2,
      position: 'absolute',
      width: 16,
    },
    plusVertical: {
      backgroundColor: colors.tealDark,
      borderRadius: 1,
      height: 16,
      position: 'absolute',
      width: 2,
    },
    title: {
      color: colors.black,
      fontFamily: FONTS.secondaryBold,
      fontSize: 34,
      lineHeight: 38,
      textTransform: 'lowercase',
    },
    subtitle: {
      color: colors.muted,
      fontFamily: FONTS.secondaryLight,
      fontSize: 14,
      marginBottom: 24,
      marginTop: 4,
    },
    editor: {
      backgroundColor: colors.surface,
      borderColor: colors.tealDark,
      borderRadius: 8,
      borderWidth: 1.5,
      marginBottom: 22,
      padding: 16,
      shadowColor: colors.teal,
      shadowOffset: { height: 4, width: 4 },
      shadowOpacity: 0.36,
      shadowRadius: 0,
    },
    editorBackdrop: {
      alignItems: 'center',
      backgroundColor: 'rgba(20,17,15,0.42)',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 18,
    },
    editorModal: { maxWidth: 440, width: '100%' },
    editorKicker: {
      color: colors.primary,
      fontFamily: FONTS.primaryBold,
      fontSize: 10,
      letterSpacing: 0.8,
      marginBottom: 18,
    },
    inputLabel: {
      color: colors.tealDark,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      letterSpacing: 0.8,
      marginBottom: 7,
    },
    input: {
      backgroundColor: colors.background,
      borderColor: colors.teal,
      borderWidth: 1,
      color: colors.black,
      fontFamily: FONTS.secondaryLight,
      fontSize: 15,
      marginBottom: 16,
      minHeight: 46,
      paddingHorizontal: 11,
      paddingVertical: 10,
    },
    notesInput: { minHeight: 96 },
    ratingPicker: { flexDirection: 'row', gap: 7, marginBottom: 17 },
    ratingPickerStar: { color: colors.yellow, fontSize: 27 },
    ratingPickerStarEmpty: { color: colors.mutedBorder },
    saveMessage: {
      color: colors.primary,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      letterSpacing: 0.6,
      marginBottom: 9,
    },
    saveButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      justifyContent: 'center',
      minHeight: 46,
    },
    saveButtonText: {
      color: colors.surface,
      fontFamily: FONTS.primaryBold,
      fontSize: 10,
      letterSpacing: 0.9,
    },
    deleteButton: {
      alignItems: 'center',
      borderColor: colors.primary,
      borderRadius: 18,
      borderWidth: 1,
      justifyContent: 'center',
      marginTop: 10,
      minHeight: 38,
    },
    deleteButtonText: {
      color: colors.primary,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      letterSpacing: 0.7,
    },
    error: {
      backgroundColor: 'rgba(156,65,65,0.10)',
      color: colors.primary,
      fontFamily: FONTS.primary,
      fontSize: 10,
      marginBottom: 14,
      padding: 10,
    },
    loadingState: { alignItems: 'center', justifyContent: 'center', minHeight: 180 },
    loadingText: { color: colors.muted, fontFamily: FONTS.primary, fontSize: 10, marginTop: 10 },
    visitList: { gap: 18, paddingRight: 4 },
    visitCard: {
      backgroundColor: colors.surface,
      borderColor: colors.teal,
      borderRadius: 8,
      borderWidth: 1.5,
      padding: 16,
      shadowColor: colors.teal,
      shadowOffset: { height: 5, width: 5 },
      shadowOpacity: 0.42,
      shadowRadius: 0,
    },
    dateBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.yellow,
      color: colors.dateBadgeText,
      fontFamily: FONTS.primaryBold,
      fontSize: 10,
      letterSpacing: 0.5,
      marginBottom: 13,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    order: {
      color: colors.black,
      fontFamily: FONTS.secondary,
      fontSize: 18,
      lineHeight: 23,
    },
    rating: {
      color: colors.muted,
      fontFamily: FONTS.primary,
      fontSize: 9,
      marginTop: 5,
    },
    ratingStars: { color: colors.yellow, letterSpacing: 1 },
    emptyStars: { color: colors.mutedBorder },
    unrated: {
      color: colors.muted,
      fontFamily: FONTS.primary,
      fontSize: 9,
      letterSpacing: 0.4,
      marginTop: 5,
    },
    divider: { backgroundColor: colors.mutedBorder, height: 1, marginVertical: 14 },
    sectionLabel: {
      color: colors.tealDark,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      letterSpacing: 0.7,
      marginBottom: 8,
    },
    companionRow: { alignItems: 'center', flexDirection: 'row' },
    avatarStack: { alignItems: 'center', flexDirection: 'row', marginRight: 10 },
    avatar: {
      borderColor: colors.surface,
      borderRadius: 17,
      borderWidth: 2,
      height: 34,
      width: 34,
    },
    avatarFallback: {
      alignItems: 'center',
      backgroundColor: colors.teal,
      justifyContent: 'center',
    },
    avatarOverlap: { marginLeft: -9 },
    avatarInitials: { color: colors.surface, fontFamily: FONTS.primaryBold, fontSize: 9 },
    companionNames: {
      color: colors.text,
      flex: 1,
      fontFamily: FONTS.secondaryLight,
      fontSize: 14,
    },
    notesBox: {
      backgroundColor: `${colors.yellow}20`,
      borderLeftColor: colors.yellow,
      borderLeftWidth: 3,
      marginTop: 15,
      padding: 11,
    },
    notesLabel: {
      color: colors.tealDark,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      letterSpacing: 0.7,
      marginBottom: 6,
    },
    notes: {
      color: colors.text,
      fontFamily: FONTS.secondaryLight,
      fontSize: 14,
      lineHeight: 20,
    },
    placeholderCopy: { color: colors.muted },
    emptyState: {
      alignItems: 'center',
      borderColor: colors.teal,
      borderWidth: 1.5,
      justifyContent: 'center',
      minHeight: 190,
      padding: 28,
    },
    emptyTitle: {
      color: colors.black,
      fontFamily: FONTS.primaryBold,
      fontSize: 11,
      letterSpacing: 0.8,
    },
    emptyCopy: {
      color: colors.muted,
      fontFamily: FONTS.secondaryLight,
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
    },
  });
}
