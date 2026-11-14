import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';

import {
  deleteHangout,
  getHangoutsForUser,
  Hangout,
  joinHangout,
} from '../api/hangoutsApi';
import {
  getFriendLocationVisits,
  syncLocationVisits,
  type FriendLocationVisit,
} from '../api/locationApi';
import { getFriends, type FriendProfile } from '../api/usersApi';
import { COLORS, FONTS } from '../constants';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import formatCalendarMonth from '../utils/formatCalendarMonth';

import TopBar from '../components/bars/TopBar';
import BottomNavBar from '../components/bars/BottomNavBar';
import HangoutCard, {
  HangoutDateBadge,
  HangoutPassedBadge,
  HangoutUpcomingBadge,
} from '../components/scheduling/HangoutCard';

type CalendarNavigation = NativeStackNavigationProp<RootStackParamList, 'ScrapbookCalendarScreen'>;

type CalendarCell = {
  date: Date;
  inMonth: boolean;
};

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function ScrapbookCalendarScreen() {
  const navigation = useNavigation<CalendarNavigation>();
  const { isLoading: authLoading, isLoggedIn, logout, user } = useAuth();
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [hangouts, setHangouts] = useState<Hangout[]>([]);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [selectedHangout, setSelectedHangout] = useState<Hangout | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) navigation.replace('Login');
  }, [authLoading, isLoggedIn, navigation]);

  const loadHangouts = useCallback(async () => {
    if (!user?.authUserId) {
      setHangouts([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      const [hangoutResult, friendResult] = await Promise.allSettled([
        getHangoutsForUser(user.authUserId),
        getFriends(),
      ]);
      if (hangoutResult.status === 'rejected') throw hangoutResult.reason;
      const result = hangoutResult.value;
      setHangouts(result.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime)));
      if (friendResult.status === 'fulfilled') setFriends(friendResult.value);
      // The scheduled backend sync handles this automatically. Triggering it
      // here makes a just-completed hangout visible without waiting a minute.
      void syncLocationVisits().catch(() => undefined);
    } catch {
      setError('Hangouts could not be refreshed. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.authUserId]);

  useFocusEffect(
    useCallback(() => {
      void loadHangouts();
    }, [loadHangouts]),
  );

  const hangoutsByDay = useMemo(() => {
    return hangouts.reduce<Record<string, Hangout[]>>((groups, hangout) => {
      const key = dateKey(new Date(hangout.startTime));
      groups[key] = [...(groups[key] ?? []), hangout];
      return groups;
    }, {});
  }, [hangouts]);

  const upcomingHangouts = useMemo(() => {
    const now = new Date();
    const future = hangouts.filter((hangout) => new Date(hangout.endTime) >= now);
    return showAll
      ? [...hangouts].sort((left, right) => Date.parse(right.startTime) - Date.parse(left.startTime))
      : future.slice(0, 3);
  }, [hangouts, showAll]);

  const openHangoutForm = (hangout?: Hangout) => {
    navigation.navigate('HangoutForm', hangout ? { hangout } : undefined);
  };

  const removeHangout = async (hangout: Hangout) => {
    await deleteHangout(hangout.authHangoutId);
    setHangouts((current) => current.filter((item) => item.authHangoutId !== hangout.authHangoutId));
    setSelectedHangout(null);
  };

  const joinSelectedHangout = async (hangout: Hangout) => {
    if (!user?.authUserId) return;
    const updated = await joinHangout(hangout.authHangoutId, user.authUserId);
    setHangouts((current) =>
      current.map((item) => (item.authHangoutId === updated.authHangoutId ? updated : item)),
    );
    setSelectedHangout(updated);
  };

  const selectDay = (date: Date) => {
    setSelectedDate(date);
    const dayHangouts = hangoutsByDay[dateKey(date)];
    if (dayHangouts?.length) setSelectedHangout(dayHangouts[0]);
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="calendar-screen">
      <View style={styles.screen} testID="calendar-screen">
        <PaperSpeckles />
        <TopBar avatarUrl={user?.avatarUrl} onLogout={logout} />

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={COLORS.primary}
              onRefresh={() => {
                setRefreshing(true);
                void loadHangouts();
              }}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <MonthHeader
            month={visibleMonth}
            onNext={() => setVisibleMonth(addMonths(visibleMonth, 1))}
            onPrevious={() => setVisibleMonth(addMonths(visibleMonth, -1))}
          />

          <CalendarGrid
            hangoutsByDay={hangoutsByDay}
            month={visibleMonth}
            onSelectDay={selectDay}
            selectedDate={selectedDate}
          />

          <View style={styles.switchRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowAll((value) => !value)}
              style={[styles.switchButton, showAll && styles.switchButtonActive]}
            >
              <Text style={[styles.switchButtonText, showAll && styles.switchButtonTextActive]}>
                {showAll ? 'SHOW UPCOMING' : 'SEE ALL HANGS'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => openHangoutForm()}
              style={styles.switchButton}
            >
              <Text style={styles.switchButtonText}>NEW HANG</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>
            <Text style={styles.sparkle}>✧ </Text>coming up...
          </Text>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>CHECKING THE CALENDAR...</Text>
            </View>
          ) : upcomingHangouts.length ? (
            <View style={styles.cardList}>
              {upcomingHangouts.map((hangout) => (
                <HangoutCard
                  hangout={hangout}
                  key={hangout.id}
                  onPress={() => setSelectedHangout(hangout)}
                />
              ))}
            </View>
          ) : (
            <EmptyHangouts onCreate={() => openHangoutForm()} />
          )}
        </ScrollView>

        <BottomNavBar
          onCreate={() => openHangoutForm()}
          onFriends={() => navigation.navigate('FriendsScreen')}
          onLogs={() => navigation.navigate('LogsScreen')}
        />

        <HangoutDetailsModal
          currentUserId={user?.authUserId}
          friends={friends}
          hangout={selectedHangout}
          onClose={() => setSelectedHangout(null)}
          onDelete={removeHangout}
          onEdit={(hangout) => {
            setSelectedHangout(null);
            openHangoutForm(hangout);
          }}
          onJoin={joinSelectedHangout}
        />
      </View>

      {/* <Pressable
        onPress={() => navigation.navigate('Login')}
        style={{ padding: 12, backgroundColor: COLORS.primary, margin: 12, borderRadius: 6 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>Go to Login Screen</Text>
      </Pressable> */}
    </SafeAreaView>
  );
}

function MonthHeader({
  month,
  onPrevious,
  onNext,
}: {
  month: Date;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.monthHeader}>
      <Pressable
        accessibilityLabel="Previous month"
        hitSlop={8}
        onPress={onPrevious}
        style={({ pressed }) => [styles.monthArrowButton, pressed && styles.monthArrowPressed]}
      >
        <Text style={styles.monthArrow}>‹</Text>
      </Pressable>
      <Text style={styles.monthTitle}>
        <Text style={styles.monthName}>{formatCalendarMonth(month)}</Text> {month.getFullYear()}
      </Text>
      <Pressable
        accessibilityLabel="Next month"
        hitSlop={8}
        onPress={onNext}
        style={({ pressed }) => [styles.monthArrowButton, pressed && styles.monthArrowPressed]}
      >
        <Text style={styles.monthArrow}>›</Text>
      </Pressable>
    </View>
  );
}

function CalendarGrid({
  month,
  hangoutsByDay,
  onSelectDay,
  selectedDate,
}: {
  month: Date;
  hangoutsByDay: Record<string, Hangout[]>;
  onSelectDay: (date: Date) => void;
  selectedDate: Date;
}) {
  const cells = useMemo(() => buildCalendar(month), [month]);
  const today = new Date();

  return (
    <View style={styles.calendarFrame}>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((weekday) => (
          <Text key={weekday} style={styles.weekday}>
            {weekday}
          </Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {cells.map((cell) => {
          const dayHangouts = hangoutsByDay[dateKey(cell.date)] ?? [];
          const allHangoutsPassed =
            dayHangouts.length > 0 &&
            dayHangouts.every((hangout) => Date.parse(hangout.endTime) < Date.now());
          const todayCell = sameDay(cell.date, today);
          const selectedCell = sameDay(cell.date, selectedDate);
          return (
            <Pressable
              accessibilityLabel={`${cell.date.toLocaleDateString()}${dayHangouts.length ? `, ${dayHangouts.length} hangout` : ''}`}
              key={cell.date.toISOString()}
              onPress={() => onSelectDay(cell.date)}
              style={[
                styles.dayCell,
                selectedCell && styles.selectedCell,
                todayCell && styles.todayCell,
              ]}
            >
              {dayHangouts.length ? (
                <Text
                  accessibilityLabel={allHangoutsPassed ? 'Finished hangout' : 'Scheduled hangout'}
                  style={[styles.hangoutMarker, allHangoutsPassed && styles.passedHangoutMarker]}
                >
                  ★
                </Text>
              ) : null}
              <Text
                style={[
                  styles.dayNumber,
                  !cell.inMonth && styles.outsideMonth,
                  todayCell && styles.todayNumber,
                ]}
              >
                {cell.date.getDate()}
              </Text>
              {dayHangouts.length > 1 ? (
                <Text style={styles.hangoutCount}>+{dayHangouts.length - 1}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function EmptyHangouts({ onCreate }: { onCreate: () => void }) {
  return (
    <LinearGradient
      colors={['#FFF8F3', '#C7EAE1']}
      // intensity={35}
      // tint="light"
      style={styles.emptyCard}
    >
      <Text style={styles.emptyTitle}>NOTHING PLANNED</Text>
      <Pressable accessibilityRole="button" onPress={onCreate} style={styles.createEmptyButton}>
        <Text style={styles.createEmptyText}>＋ CREATE A HANG</Text>
      </Pressable>
    </LinearGradient>
  );
}

function HangoutDetailsModal({
  currentUserId,
  friends,
  hangout,
  onClose,
  onDelete,
  onEdit,
  onJoin,
}: {
  currentUserId?: string | null;
  friends: FriendProfile[];
  hangout: Hangout | null;
  onClose: () => void;
  onDelete: (hangout: Hangout) => Promise<void>;
  onEdit: (hangout: Hangout) => void;
  onJoin: (hangout: Hangout) => Promise<void>;
}) {
  const [actionError, setActionError] = useState<string>();
  const [actionPending, setActionPending] = useState(false);
  const [friendVisits, setFriendVisits] = useState<FriendLocationVisit[]>([]);
  const [friendVisitsLoading, setFriendVisitsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setFriendVisits([]);
    if (!hangout?.location.trim() || friends.length === 0) return () => undefined;

    const loadFriendVisits = async () => {
      try {
        setFriendVisitsLoading(true);
        await syncLocationVisits();
        const visits = await getFriendLocationVisits(
          hangout.location,
          friends.map((friend) => friend.authUserId),
        );
        if (active) setFriendVisits(visits);
      } catch {
        if (active) setFriendVisits([]);
      } finally {
        if (active) setFriendVisitsLoading(false);
      }
    };

    void loadFriendVisits();
    return () => {
      active = false;
    };
  }, [friends, hangout?.location]);

  if (!hangout) return null;

  const isParticipant = Boolean(
    currentUserId && hangout.participantAuthUserIds.includes(currentUserId),
  );
  const isInvited = Boolean(currentUserId && hangout.invitedAuthUserIds.includes(currentUserId));
  const isHost = hangout.participantAuthUserIds[0] === currentUserId;

  const runAction = async (action: () => Promise<void>, failureMessage: string) => {
    try {
      setActionError(undefined);
      setActionPending(true);
      await action();
    } catch {
      setActionError(failureMessage);
    } finally {
      setActionPending(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete hangout?', 'This cannot be undone.', [
      { style: 'cancel', text: 'Cancel' },
      {
        style: 'destructive',
        text: 'Delete',
        onPress: () =>
          void runAction(() => onDelete(hangout), 'The hangout could not be deleted.'),
      },
    ]);
  };

  const openDirections = async () => {
    const query = encodeURIComponent(hangout.location);
    await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalBackdrop}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
        <Pressable
          accessibilityLabel="Close hangout details"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.modalBorder}>
          <GlassView
            style={styles.glassCard}
            glassEffectStyle={{ style: 'clear', animate: true, animationDuration: 0.5 }}
          >
            <Pressable
              accessibilityLabel="Close"
              hitSlop={12}
              onPress={onClose}
              style={styles.modalClose}
            >
              <Text style={styles.modalCloseText}>×</Text>
            </Pressable>
            <View style={styles.modalBadgeRow}>
              <HangoutDateBadge startTime={hangout.startTime} />
              <HangoutPassedBadge endTime={hangout.endTime} />
              <HangoutUpcomingBadge startTime={hangout.startTime} />
            </View>
            <Text style={styles.modalTitle}>{hangout.hangoutName}</Text>
            <Text style={styles.modalMetadata}>
              ❤︎ {hangout.participantAuthUserIds.length} GOING
            </Text>

            <View style={styles.participantGrid}>
              {hangout.participantAuthUserIds.slice(0, 6).map((participantId, index) => (
                <View key={participantId} style={styles.participant}>
                  <View style={[styles.participantAvatar, { backgroundColor: avatarColor(index) }]}>
                    <Text style={styles.participantAvatarText}>{index + 1}</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.participantName}>
                    {participantId === currentUserId ? 'you' : `friend ${index + 1}`}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.aboutTitle}>about this hang</Text>
            <Text style={styles.description}>{hangout.description || 'No description yet.'}</Text>
            <Text numberOfLines={2} style={styles.modalMetadata}>
              🌐︎ {hangout.location || 'LOCATION TBD'}
            </Text>
            {friendVisitsLoading ? (
              <Text style={styles.locationHistoryLoading}>CHECKING FRIEND HISTORY...</Text>
            ) : friendVisits.length ? (
              <View style={styles.locationHistory}>
                <Text style={styles.locationHistoryTitle}>✧ FRIENDS WHO HAVE BEEN HERE</Text>
                {friendVisits.map((visit) => {
                  const friend = friends.find(
                    (candidate) => candidate.authUserId === visit.authUserId,
                  );
                  return (
                    <Text key={visit.authUserId} style={styles.locationHistoryText}>
                      {friend?.displayName ?? 'A friend'} · {visit.visitCount}{' '}
                      {visit.visitCount === 1 ? 'visit' : 'visits'}
                    </Text>
                  );
                })}
              </View>
            ) : null}
            <Text style={styles.modalMetadata}>{isHost ? 'ツ HOSTED BY YOU' : 'ツ FRIEND HANG'}</Text>

            {isInvited ? <Text style={styles.inviteNotice}>YOU ARE INVITED</Text> : null}
            {actionError ? <Text style={styles.errorBanner}>{actionError}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable onPress={() => void openDirections()} style={styles.primaryAction}>
                <Text style={styles.primaryActionText}>DIRECTIONS</Text>
              </Pressable>
              {isHost ? (
                <Pressable onPress={() => onEdit(hangout)} style={styles.secondaryAction}>
                  <Text style={styles.secondaryActionText}>EDIT HANG</Text>
                </Pressable>
              ) : !isParticipant && (isInvited || hangout.isOpen) ? (
                <Pressable
                  disabled={actionPending}
                  onPress={() =>
                    void runAction(() => onJoin(hangout), 'The hangout could not be joined.')
                  }
                  style={styles.secondaryAction}
                >
                  <Text style={styles.secondaryActionText}>
                    {actionPending ? 'JOINING...' : isInvited ? 'ACCEPT INVITE' : 'JOIN HANG'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {isHost ? (
              <Pressable disabled={actionPending} onPress={confirmDelete} style={styles.deleteAction}>
                <Text style={styles.deleteActionText}>
                  {actionPending ? 'DELETING...' : 'DELETE HANG'}
                </Text>
              </Pressable>
            ) : null}
          </GlassView>
        </View>
      </View>
    </Modal>
  );
}

function PaperSpeckles() {
  return (
    <View pointerEvents="none" style={styles.speckles}>
      {Array.from({ length: 22 }).map((_, index) => (
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

function buildCalendar(month: Date): CalendarCell[] {
  const first = startOfMonth(month);
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
    );
    return { date, inMonth: date.getMonth() === month.getMonth() };
  });
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sameDay(left: Date, right: Date) {
  return dateKey(left) === dateKey(right);
}

function avatarColor(index: number) {
  return [COLORS.coral, '#f8b3d2', '#8dded1', '#c7a3ff', '#ffd084', '#98c9ff'][index % 6];
}

const MONO = FONTS.secondary;

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#fbf5ef', flex: 1 },
  screen: { backgroundColor: '#fbf5ef', flex: 1 },
  speckles: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  speck: { backgroundColor: 'rgba(156, 65, 65, 0.16)', height: 1, position: 'absolute', width: 3 },
  topBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(251,245,239,0.96)',
    borderBottomColor: COLORS.teal,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 66,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  brandRow: { alignItems: 'center', flexDirection: 'row' },
  menuIcon: { color: COLORS.primary, fontSize: 22, marginRight: 14 },
  brand: { color: COLORS.primary, fontFamily: MONO, fontSize: 17, fontWeight: '700' },
  avatar: { borderColor: COLORS.primary, borderWidth: 2, height: 40, width: 40 },
  content: { paddingBottom: 128, paddingHorizontal: 16, paddingTop: 18 },
  monthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthArrowButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(132,165,157,0.12)',
    borderColor: COLORS.tealDark,
    borderRadius: 18,
    borderWidth: 1.5,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  monthArrowPressed: { backgroundColor: 'rgba(132,165,157,0.24)', opacity: 0.72 },
  monthArrow: {
    color: COLORS.tealDark,
    fontFamily: FONTS.secondary,
    fontSize: 29,
    lineHeight: 31,
    textAlign: 'center',
  },
  monthTitle: {
    color: '#171413',
    fontFamily: FONTS.secondaryBold,
    fontSize: 36,
    lineHeight: 42,
    textTransform: 'lowercase',
  },
  monthName: { fontFamily: FONTS.secondaryBold },
  calendarFrame: {
    borderColor: COLORS.black,
    borderRadius: 7,
    borderWidth: 2,
    overflow: 'hidden',
    padding: 12,
  },
  weekdayRow: {
    borderBottomColor: COLORS.teal,
    borderBottomWidth: 2,
    flexDirection: 'row',
    paddingBottom: 10,
  },
  weekday: { color: COLORS.text, flex: 1, fontFamily: MONO, fontSize: 12, textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: 8 },
  dayCell: {
    alignItems: 'center',
    borderColor: 'rgba(132, 165, 157, 0.24)',
    borderWidth: StyleSheet.hairlineWidth,
    height: 48,
    justifyContent: 'center',
    position: 'relative',
    width: '14.285714%',
  },
  todayCell: {
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.teal,
    borderWidth: 1.5,
    borderRadius: 4,
  },
  selectedCell: {
    backgroundColor: 'rgba(132,165,157,0.14)',
    borderColor: COLORS.tealDark,
    borderWidth: 1.5,
    borderRadius: 4,
  },
  dayNumber: { color: '#211e1c', fontFamily: MONO, fontSize: 15 },
  todayNumber: { fontWeight: '800' },
  outsideMonth: { color: 'rgba(85, 66, 65, 0.28)' },
  hangoutMarker: { color: COLORS.teal, fontSize: 12, position: 'absolute', right: 3, top: 2 },
  passedHangoutMarker: { color: COLORS.primary, opacity: 0.55 },
  hangoutCount: {
    bottom: 1,
    color: COLORS.primary,
    fontFamily: MONO,
    fontSize: 8,
    position: 'absolute',
    right: 2,
  },
  switchRow: { flexDirection: 'row', marginTop: 18 },
  switchButton: {
    alignItems: 'center',
    borderColor: COLORS.primary,
    borderWidth: 2,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    margin: 2,
  },
  switchButtonActive: { backgroundColor: COLORS.primary },
  switchButtonText: {
    color: '#211e1c',
    fontFamily: FONTS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  switchButtonTextActive: { color: '#fffaf5' },
  sectionTitle: {
    color: '#211e1c',
    fontFamily: MONO,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    marginTop: 38,
  },
  sparkle: { color: COLORS.coral, fontSize: 28 },
  errorBanner: {
    backgroundColor: 'rgba(156,65,65,0.10)',
    color: COLORS.primary,
    fontFamily: MONO,
    fontSize: 11,
    marginBottom: 12,
    padding: 10,
  },
  loadingCard: {
    alignItems: 'center',
    borderColor: COLORS.teal,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 210,
  },
  loadingText: { color: COLORS.text, fontFamily: MONO, fontSize: 11, marginTop: 12 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderColor: COLORS.tealDark,
    borderRadius: 7,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 310,
    padding: 22,
    shadowColor: COLORS.teal,
    shadowOffset: { height: 6, width: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 0,
  },
  emptyTitle: { color: '#171413', fontFamily: MONO, fontSize: 22, marginBottom: 14 },
  createEmptyButton: {
    backgroundColor: 'rgba(132,165,157,0.12)',
    borderColor: COLORS.teal,
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  createEmptyText: {
    color: COLORS.tealDark,
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cardList: { alignItems: 'center' },
  modalBackdrop: {
    alignItems: 'center',
    // backgroundColor: 'rgba(167, 154, 146, 0.42)',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  modalBorder: {
    borderColor: COLORS.black,
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 420,
  },
  glassCard: {
    borderRadius: 10,
    maxWidth: 420,
    padding: 30,
    width: '100%',
    // backgroundColor: COLORS.background,
    backgroundColor: 'rgba(255, 246, 239, 0.42)',
  },
  modalClose: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    right: 9,
    top: 7,
    width: 34,
  },
  modalCloseText: { color: COLORS.text, fontSize: 28 },
  modalTitle: {
    color: '#211e1c',
    fontFamily: FONTS.secondaryLight,
    fontSize: 25,
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'lowercase',
  },
  modalBadgeRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalMetadata: {
    color: COLORS.text,
    fontFamily: FONTS.primary,
    fontSize: 11,
    letterSpacing: 1.2,
    lineHeight: 23,
    textTransform: 'uppercase',
  },
  locationHistory: {
    backgroundColor: 'rgba(132,165,157,0.12)',
    borderColor: COLORS.teal,
    borderWidth: 1,
    marginBottom: 12,
    padding: 10,
  },
  locationHistoryTitle: {
    color: COLORS.tealDark,
    fontFamily: FONTS.primaryBold,
    fontSize: 9,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  locationHistoryText: {
    color: COLORS.text,
    fontFamily: FONTS.primary,
    fontSize: 10,
    lineHeight: 16,
  },
  locationHistoryLoading: {
    color: COLORS.muted,
    fontFamily: FONTS.primary,
    fontSize: 9,
    marginBottom: 12,
  },
  participantGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14, marginTop: 12 },
  participant: { alignItems: 'center', flexDirection: 'row', marginBottom: 8, width: '50%' },
  participantAvatar: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginRight: 8,
    width: 24,
  },
  participantAvatarText: { color: '#fff', fontFamily: FONTS.primary, fontSize: 10 },
  participantName: { color: COLORS.text, flex: 1, fontFamily: FONTS.primary, fontSize: 11 },
  aboutTitle: {
    color: '#211e1c',
    fontFamily: FONTS.secondaryLight,
    fontSize: 19,
    marginBottom: 10,
    marginTop: 4,
  },
  description: {
    color: COLORS.text,
    fontFamily: FONTS.primary,
    fontSize: 11,
    lineHeight: 20,
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', marginTop: 18 },
  inviteNotice: {
    color: COLORS.tealDark,
    fontFamily: FONTS.primaryBold,
    fontSize: 11,
    marginTop: 10,
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
    margin: 2,
  },
  primaryActionText: {
    color: '#fff',
    fontFamily: FONTS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  secondaryAction: {
    alignItems: 'center',
    borderColor: COLORS.primary,
    borderWidth: 2,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
    margin: 2,
  },
  secondaryActionText: {
    color: COLORS.text,
    fontFamily: FONTS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  deleteAction: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  deleteActionText: {
    color: COLORS.primary,
    fontFamily: FONTS.primaryBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
});
