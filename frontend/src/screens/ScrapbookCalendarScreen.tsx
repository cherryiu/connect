import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';

import { deleteHangout, getHangoutsForUser, Hangout, joinHangout } from '../api/hangoutsApi';
import {
  confirmLocationVisitAttendance,
  getFriendLocationVisits,
  getPendingLocationVisits,
  syncLocationVisits,
  type FriendLocationVisit,
  type PendingLocationVisit,
} from '../api/locationApi';
import { getFriends, type FriendProfile } from '../api/usersApi';
import { FONTS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { type AppColors, useTheme } from '../context/ThemeContext';
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

type HangoutDateFilter = {
  date: Date;
  mode: 'day' | 'month';
};

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function ScrapbookCalendarScreen() {
  const navigation = useNavigation<CalendarNavigation>();
  const { isLoading: authLoading, isLoggedIn, logout, user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [hangouts, setHangouts] = useState<Hangout[]>([]);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pendingVisits, setPendingVisits] = useState<PendingLocationVisit[]>([]);
  const [pendingActionId, setPendingActionId] = useState<string>();
  const [selectedHangout, setSelectedHangout] = useState<Hangout | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [hangoutSearch, setHangoutSearch] = useState('');
  const [hangoutDateFilter, setHangoutDateFilter] = useState<HangoutDateFilter | null>(null);
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
    const authUserId = user.authUserId;

    try {
      setError(null);
      const pendingVisitRequest = syncLocationVisits()
        .catch(() => undefined)
        .then(() => getPendingLocationVisits(authUserId));
      const [hangoutResult, friendResult, pendingVisitResult] = await Promise.allSettled([
        getHangoutsForUser(authUserId),
        getFriends(),
        pendingVisitRequest,
      ]);
      if (hangoutResult.status === 'rejected') throw hangoutResult.reason;
      const result = hangoutResult.value;
      setHangouts(result.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime)));
      if (friendResult.status === 'fulfilled') setFriends(friendResult.value);
      if (pendingVisitResult.status === 'fulfilled') setPendingVisits(pendingVisitResult.value);
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

  const displayedHangouts = useMemo(() => {
    const now = new Date();
    const future = hangouts.filter((hangout) => new Date(hangout.endTime) >= now);
    if (!showAll) return future.slice(0, 3);

    return hangouts
      .filter((hangout) => matchesHangoutFilters(hangout, hangoutSearch, hangoutDateFilter))
      .sort((left, right) => Date.parse(right.startTime) - Date.parse(left.startTime));
  }, [hangoutDateFilter, hangoutSearch, hangouts, showAll]);

  const filtersActive = hangoutSearch.trim().length > 0 || hangoutDateFilter !== null;

  const toggleShowAll = () => {
    if (showAll) {
      setHangoutSearch('');
      setHangoutDateFilter(null);
    }
    setShowAll((current) => !current);
  };

  const clearHangoutFilters = () => {
    setHangoutSearch('');
    setHangoutDateFilter(null);
  };

  const toggleDateFilter = (mode: HangoutDateFilter['mode']) => {
    setHangoutDateFilter((current) => {
      const matchesSelection =
        current?.mode === mode &&
        (mode === 'day'
          ? sameDay(current.date, selectedDate)
          : sameMonth(current.date, selectedDate));
      return matchesSelection ? null : { date: selectedDate, mode };
    });
  };

  const openHangoutForm = (hangout?: Hangout) => {
    navigation.navigate('HangoutForm', hangout ? { hangout } : undefined);
  };

  const removeHangout = async (hangout: Hangout) => {
    await deleteHangout(hangout.authHangoutId);
    setHangouts((current) =>
      current.filter((item) => item.authHangoutId !== hangout.authHangoutId),
    );
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
    if (showAll) return;
    const dayHangouts = hangoutsByDay[dateKey(date)];
    if (dayHangouts?.length) setSelectedHangout(dayHangouts[0]);
  };

  const openVisitEditor = (visit: PendingLocationVisit) => {
    navigation.navigate('PlaceHistoryScreen', {
      editHangoutId: visit.authHangoutId,
      place: {
        lastVisitedAt: visit.visitedAt,
        location: visit.location,
        visitCount: 1,
      },
    });
  };

  const confirmAttendance = async (visit: PendingLocationVisit, attended: boolean) => {
    if (!user?.authUserId) return;
    try {
      setError(null);
      setPendingActionId(visit.authHangoutId);
      await confirmLocationVisitAttendance(user.authUserId, visit.authHangoutId, attended);
      setPendingVisits((current) =>
        current.filter((pending) => pending.authHangoutId !== visit.authHangoutId),
      );
      if (attended) openVisitEditor(visit);
    } catch {
      setError('Attendance could not be saved. Please try again.');
    } finally {
      setPendingActionId(undefined);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="calendar-screen">
      <View style={styles.screen} testID="calendar-screen">
        <PaperSpeckles />
        <TopBar avatarUrl={user?.avatarUrl} onLogout={logout} />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.primary}
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

          {pendingVisits.length ? (
            <View style={styles.visitPromptList}>
              {pendingVisits.map((visit) => (
                <VisitConfirmationPrompt
                  key={visit.authHangoutId}
                  loading={pendingActionId === visit.authHangoutId}
                  onConfirm={(attended) => void confirmAttendance(visit, attended)}
                  onOpen={() => openVisitEditor(visit)}
                  visit={visit}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.switchRow}>
            <Pressable
              accessibilityRole="button"
              onPress={toggleShowAll}
              style={({ pressed }) => [
                styles.switchButton,
                showAll && styles.switchButtonActive,
                pressed && styles.switchButtonPressed,
              ]}
            >
              <Text style={[styles.switchButtonText, showAll && styles.switchButtonTextActive]}>
                {showAll ? 'SHOW UPCOMING' : 'SEE ALL HANGS'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => openHangoutForm()}
              style={({ pressed }) => [
                styles.switchButton,
                styles.createHangButton,
                pressed && styles.switchButtonPressed,
              ]}
            >
              <Text style={[styles.switchButtonText, styles.createHangButtonText]}>
                CREATE NEW HANG
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>
            <Text style={styles.sparkle}>✧ </Text>
            {showAll ? 'all hangs...' : 'coming up...'}
          </Text>

          {showAll ? (
            <View style={styles.filterPanel}>
              <TextInput
                accessibilityLabel="Search hangouts by name or location"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setHangoutSearch}
                placeholder="SEARCH NAME OR LOCATION"
                placeholderTextColor={colors.placeholder}
                returnKeyType="search"
                style={styles.hangoutSearchInput}
                value={hangoutSearch}
              />

              <View style={styles.filterActionRow}>
                <Pressable
                  accessibilityHint="Uses the day selected in the calendar above"
                  accessibilityRole="button"
                  onPress={() => toggleDateFilter('day')}
                  style={({ pressed }) => [
                    styles.dateFilterButton,
                    hangoutDateFilter?.mode === 'day' && styles.dateFilterButtonActive,
                    pressed && styles.switchButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateFilterButtonText,
                      hangoutDateFilter?.mode === 'day' && styles.dateFilterButtonTextActive,
                    ]}
                  >
                    DAY: {formatFilterDate(selectedDate)}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityHint="Uses the month selected in the calendar above"
                  accessibilityRole="button"
                  onPress={() => toggleDateFilter('month')}
                  style={({ pressed }) => [
                    styles.dateFilterButton,
                    hangoutDateFilter?.mode === 'month' && styles.dateFilterButtonActive,
                    pressed && styles.switchButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateFilterButtonText,
                      hangoutDateFilter?.mode === 'month' && styles.dateFilterButtonTextActive,
                    ]}
                  >
                    MONTH: {formatFilterMonth(selectedDate)}
                  </Text>
                </Pressable>

                {filtersActive ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={clearHangoutFilters}
                    style={({ pressed }) => [
                      styles.clearFiltersButton,
                      pressed && styles.switchButtonPressed,
                    ]}
                  >
                    <Text style={styles.clearFiltersButtonText}>CLEAR</Text>
                  </Pressable>
                ) : null}
              </View>

              <Text style={styles.dateFilterHint}>
                Select a calendar day above, then filter by that day or its month.
              </Text>
            </View>
          ) : null}

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>CHECKING THE CALENDAR...</Text>
            </View>
          ) : displayedHangouts.length ? (
            <View style={styles.cardList}>
              {displayedHangouts.map((hangout) => (
                <HangoutCard
                  hangout={hangout}
                  key={hangout.id}
                  onPress={() => setSelectedHangout(hangout)}
                />
              ))}
            </View>
          ) : (
            <EmptyHangouts
              onClearFilters={filtersActive ? clearHangoutFilters : undefined}
              onCreate={() => openHangoutForm()}
            />
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
        style={{ padding: 12, backgroundColor: colors.primary, margin: 12, borderRadius: 6 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>Go to Login Screen</Text>
      </Pressable> */}
    </SafeAreaView>
  );
}

function VisitConfirmationPrompt({
  loading,
  onConfirm,
  onOpen,
  visit,
}: {
  loading: boolean;
  onConfirm: (attended: boolean) => void;
  onOpen: () => void;
  visit: PendingLocationVisit;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const attendanceConfirmed = visit.attendanceConfirmed === true;

  return (
    <View style={styles.visitPrompt}>
      <Pressable
        accessibilityHint="Opens this visit so you can add your order, rating, and notes"
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [styles.visitPromptCopy, pressed && styles.promptPressed]}
      >
        <Text style={styles.visitPromptKicker}>
          {attendanceConfirmed ? 'ADD YOUR ORDER' : 'DID YOU MAKE IT?'}
        </Text>
        <Text numberOfLines={1} style={styles.visitPromptTitle}>
          {visit.hangoutName || visit.location}
        </Text>
        <Text style={styles.visitPromptMessage}>
          {attendanceConfirmed
            ? 'Your visit is confirmed. Finish your log.'
            : 'Confirm attendance and add what you ordered.'}
        </Text>
      </Pressable>
      <View style={styles.visitPromptActions}>
        {attendanceConfirmed ? (
          <Text style={styles.visitPromptArrow}>→</Text>
        ) : loading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <>
            <Pressable
              accessibilityLabel="I did not attend"
              accessibilityRole="button"
              onPress={() => onConfirm(false)}
              style={({ pressed }) => [styles.attendanceButton, pressed && styles.promptPressed]}
            >
              <Text style={styles.declineText}>×</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="I attended"
              accessibilityRole="button"
              onPress={() => onConfirm(true)}
              style={({ pressed }) => [
                styles.attendanceButton,
                styles.confirmButton,
                pressed && styles.promptPressed,
              ]}
            >
              <Text style={styles.confirmText}>✓</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

function EmptyHangouts({
  onClearFilters,
  onCreate,
}: {
  onClearFilters?: () => void;
  onCreate: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <LinearGradient
      colors={[colors.surface, colors.background]}
      // intensity={35}
      // tint="light"
      style={styles.emptyCard}
    >
      <Text style={styles.emptyTitle}>
        {onClearFilters ? 'NO MATCHING HANGS' : 'NOTHING PLANNED'}
      </Text>
      {onClearFilters ? (
        <Pressable
          accessibilityRole="button"
          onPress={onClearFilters}
          style={styles.createEmptyButton}
        >
          <Text style={styles.createEmptyText}>CLEAR FILTERS</Text>
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" onPress={onCreate} style={styles.createEmptyButton}>
          <Text style={styles.createEmptyText}>＋ CREATE A HANG</Text>
        </Pressable>
      )}
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [actionError, setActionError] = useState<string>();
  const [actionPending, setActionPending] = useState(false);
  const [friendVisits, setFriendVisits] = useState<FriendLocationVisit[]>([]);
  const [friendVisitsLoading, setFriendVisitsLoading] = useState(false);
  const [friendVisitsExpanded, setFriendVisitsExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    setFriendVisits([]);
    setFriendVisitsExpanded(false);
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
        onPress: () => void runAction(() => onDelete(hangout), 'The hangout could not be deleted.'),
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
                  <View
                    style={[
                      styles.participantAvatar,
                      { backgroundColor: avatarColor(index, colors) },
                    ]}
                  >
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
              <>
                <Pressable
                  accessibilityLabel={`${friendVisits.length} friends have been here`}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: friendVisitsExpanded }}
                  onPress={() => setFriendVisitsExpanded((expanded) => !expanded)}
                  style={({ pressed }) => [
                    styles.locationHistorySummary,
                    pressed && styles.locationHistorySummaryPressed,
                  ]}
                >
                  <View style={styles.locationAvatarStack}>
                    {friendVisits.slice(0, 4).map((visit, index) => {
                      const friend = friends.find(
                        (candidate) => candidate.authUserId === visit.authUserId,
                      );
                      return friend?.avatarUrl ? (
                        <Image
                          key={visit.authUserId}
                          source={{ uri: friend.avatarUrl }}
                          style={[styles.locationAvatar, index > 0 && styles.locationAvatarOverlap]}
                        />
                      ) : (
                        <View
                          key={visit.authUserId}
                          style={[
                            styles.locationAvatar,
                            styles.locationAvatarFallback,
                            index > 0 && styles.locationAvatarOverlap,
                          ]}
                        >
                          <Text style={styles.locationAvatarInitials}>
                            {friendInitials(friend?.displayName)}
                          </Text>
                        </View>
                      );
                    })}
                    {friendVisits.length > 4 ? (
                      <View
                        style={[
                          styles.locationAvatar,
                          styles.locationAvatarMore,
                          styles.locationAvatarOverlap,
                        ]}
                      >
                        <Text style={styles.locationAvatarInitials}>
                          +{friendVisits.length - 4}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.locationHistorySummaryText}>
                    {friendVisits.length} {friendVisits.length === 1 ? 'FRIEND' : 'FRIENDS'}
                  </Text>
                  <Text style={styles.locationHistoryChevron}>
                    {friendVisitsExpanded ? '⌃' : '⌄'}
                  </Text>
                </Pressable>

                {friendVisitsExpanded ? (
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
              </>
            ) : null}
            <Text style={styles.modalMetadata}>
              {isHost ? 'ツ HOSTED BY YOU' : 'ツ FRIEND HANG'}
            </Text>

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
              <Pressable
                disabled={actionPending}
                onPress={confirmDelete}
                style={styles.deleteAction}
              >
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

function sameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function matchesHangoutFilters(
  hangout: Hangout,
  search: string,
  dateFilter: HangoutDateFilter | null,
) {
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const matchesSearch =
    normalizedSearch.length === 0 ||
    hangout.hangoutName.toLocaleLowerCase().includes(normalizedSearch) ||
    hangout.location.toLocaleLowerCase().includes(normalizedSearch);
  const hangoutDate = new Date(hangout.startTime);
  const matchesDate =
    dateFilter === null ||
    (dateFilter.mode === 'day'
      ? sameDay(hangoutDate, dateFilter.date)
      : sameMonth(hangoutDate, dateFilter.date));
  return matchesSearch && matchesDate;
}

function formatFilterDate(date: Date) {
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase();
}

function formatFilterMonth(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase();
}

function avatarColor(index: number, colors: AppColors) {
  return [colors.coral, '#8B7898', colors.teal, colors.yellow, colors.primary][index % 5];
}

function friendInitials(displayName?: string) {
  if (!displayName) return '?';
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const MONO = FONTS.secondary;

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
    topBar: {
      alignItems: 'center',
      backgroundColor: 'rgba(251,245,239,0.96)',
      borderBottomColor: colors.teal,
      borderBottomWidth: 1,
      flexDirection: 'row',
      height: 66,
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      zIndex: 2,
    },
    brandRow: { alignItems: 'center', flexDirection: 'row' },
    menuIcon: { color: colors.primary, fontSize: 22, marginRight: 14 },
    brand: { color: colors.primary, fontFamily: MONO, fontSize: 17, fontWeight: '700' },
    avatar: { borderColor: colors.primary, borderWidth: 2, height: 40, width: 40 },
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
      borderColor: colors.tealDark,
      borderRadius: 18,
      borderWidth: 1.5,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    monthArrowPressed: { backgroundColor: 'rgba(132,165,157,0.24)', opacity: 0.72 },
    monthArrow: {
      color: colors.tealDark,
      fontFamily: FONTS.secondary,
      fontSize: 29,
      lineHeight: 31,
      textAlign: 'center',
    },
    monthTitle: {
      color: colors.black,
      fontFamily: FONTS.secondaryBold,
      fontSize: 36,
      lineHeight: 42,
      textTransform: 'lowercase',
    },
    monthName: { fontFamily: FONTS.secondaryBold },
    calendarFrame: {
      backgroundColor: colors.surface,
      borderColor: colors.black,
      borderRadius: 7,
      borderWidth: 2,
      overflow: 'hidden',
      padding: 12,
    },
    weekdayRow: {
      borderBottomColor: colors.teal,
      borderBottomWidth: 2,
      flexDirection: 'row',
      paddingBottom: 10,
    },
    weekday: { color: colors.text, flex: 1, fontFamily: MONO, fontSize: 12, textAlign: 'center' },
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
      backgroundColor: colors.yellow,
      borderColor: colors.teal,
      borderWidth: 1.5,
      borderRadius: 4,
    },
    selectedCell: {
      backgroundColor: 'rgba(132,165,157,0.14)',
      borderColor: colors.tealDark,
      borderWidth: 1.5,
      borderRadius: 4,
    },
    dayNumber: { color: colors.black, fontFamily: MONO, fontSize: 15 },
    todayNumber: { fontWeight: '800' },
    outsideMonth: { color: colors.muted, opacity: 0.4 },
    hangoutMarker: { color: colors.teal, fontSize: 12, position: 'absolute', right: 3, top: 2 },
    passedHangoutMarker: { color: colors.primary, opacity: 0.55 },
    hangoutCount: {
      bottom: 1,
      color: colors.primary,
      fontFamily: MONO,
      fontSize: 8,
      position: 'absolute',
      right: 2,
    },
    visitPromptList: { gap: 10, marginTop: 16 },
    visitPrompt: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.tealDark,
      borderRadius: 7,
      borderWidth: 1.5,
      flexDirection: 'row',
      minHeight: 88,
      padding: 11,
      shadowColor: colors.teal,
      shadowOffset: { height: 3, width: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 0,
    },
    visitPromptCopy: { flex: 1, paddingRight: 10 },
    visitPromptKicker: {
      color: colors.primary,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      letterSpacing: 0.8,
    },
    visitPromptTitle: {
      color: colors.black,
      fontFamily: FONTS.secondaryBold,
      fontSize: 16,
      marginTop: 3,
      textTransform: 'lowercase',
    },
    visitPromptMessage: {
      color: colors.muted,
      fontFamily: FONTS.secondaryLight,
      fontSize: 12,
      marginTop: 3,
    },
    visitPromptActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 7,
      minWidth: 83,
    },
    attendanceButton: {
      alignItems: 'center',
      borderColor: colors.primary,
      borderRadius: 18,
      borderWidth: 1.5,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    confirmButton: { backgroundColor: colors.tealDark, borderColor: colors.tealDark },
    declineText: { color: colors.primary, fontFamily: FONTS.primaryBold, fontSize: 19 },
    confirmText: { color: colors.surface, fontFamily: FONTS.primaryBold, fontSize: 17 },
    visitPromptArrow: { color: colors.primary, fontFamily: FONTS.primaryBold, fontSize: 22 },
    promptPressed: { opacity: 0.58 },
    switchRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
    switchButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.mutedBorder,
      borderRadius: 20,
      borderWidth: 1,
      flex: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 12,
    },
    switchButtonActive: { backgroundColor: colors.tealSoft, borderColor: colors.teal },
    switchButtonPressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
    switchButtonText: {
      color: colors.muted,
      fontFamily: FONTS.primaryBold,
      fontSize: 10,
      letterSpacing: 0.55,
    },
    switchButtonTextActive: { color: colors.tealDark },
    createHangButton: { backgroundColor: colors.tealSoft, borderColor: colors.teal },
    createHangButtonText: { color: colors.tealDark },
    filterPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.mutedBorder,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 16,
      padding: 12,
    },
    hangoutSearchInput: {
      backgroundColor: colors.background,
      borderColor: colors.teal,
      borderRadius: 8,
      borderWidth: 1,
      color: colors.black,
      fontFamily: FONTS.primary,
      fontSize: 10,
      minHeight: 42,
      paddingHorizontal: 12,
    },
    filterActionRow: { flexDirection: 'row', gap: 8, marginTop: 9 },
    dateFilterButton: {
      alignItems: 'center',
      backgroundColor: colors.tealSoft,
      borderColor: colors.teal,
      borderRadius: 18,
      borderWidth: 1,
      flex: 1,
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: 11,
    },
    dateFilterButtonActive: { backgroundColor: colors.tealDark },
    dateFilterButtonText: {
      color: colors.tealDark,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      letterSpacing: 0.5,
    },
    dateFilterButtonTextActive: { color: colors.surface },
    clearFiltersButton: {
      alignItems: 'center',
      borderColor: colors.mutedBorder,
      borderRadius: 18,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: 14,
    },
    clearFiltersButtonText: {
      color: colors.primary,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      letterSpacing: 0.5,
    },
    dateFilterHint: {
      color: colors.muted,
      fontFamily: FONTS.secondaryLight,
      fontSize: 11,
      marginTop: 8,
    },
    sectionTitle: {
      color: colors.black,
      fontFamily: MONO,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 16,
      marginTop: 38,
    },
    sparkle: { color: colors.coral, fontSize: 28 },
    errorBanner: {
      backgroundColor: 'rgba(156,65,65,0.10)',
      color: colors.primary,
      fontFamily: MONO,
      fontSize: 11,
      marginBottom: 12,
      padding: 10,
    },
    loadingCard: {
      alignItems: 'center',
      borderColor: colors.teal,
      borderWidth: 2,
      justifyContent: 'center',
      minHeight: 210,
    },
    loadingText: { color: colors.text, fontFamily: MONO, fontSize: 11, marginTop: 12 },
    emptyCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.tealDark,
      borderRadius: 7,
      borderWidth: 2,
      justifyContent: 'center',
      minHeight: 310,
      padding: 22,
      shadowColor: colors.teal,
      shadowOffset: { height: 6, width: 6 },
      shadowOpacity: 0.7,
      shadowRadius: 0,
    },
    emptyTitle: { color: colors.black, fontFamily: MONO, fontSize: 22, marginBottom: 14 },
    createEmptyButton: {
      backgroundColor: 'rgba(132,165,157,0.12)',
      borderColor: colors.teal,
      borderWidth: 1,
      paddingHorizontal: 28,
      paddingVertical: 10,
    },
    createEmptyText: {
      color: colors.tealDark,
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
      borderColor: colors.black,
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
      backgroundColor: colors.surface,
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
    modalCloseText: { color: colors.text, fontSize: 28 },
    modalTitle: {
      color: colors.black,
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
      color: colors.text,
      fontFamily: FONTS.primary,
      fontSize: 11,
      letterSpacing: 1.2,
      lineHeight: 23,
      textTransform: 'uppercase',
    },
    locationHistory: {
      backgroundColor: 'rgba(132,165,157,0.12)',
      borderColor: colors.teal,
      borderWidth: 1,
      marginBottom: 12,
      padding: 10,
    },
    locationHistorySummary: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(132,165,157,0.12)',
      borderColor: colors.teal,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      marginBottom: 10,
      marginTop: 4,
      minHeight: 42,
      paddingHorizontal: 8,
    },
    locationHistorySummaryPressed: { backgroundColor: 'rgba(132,165,157,0.24)', opacity: 0.72 },
    locationAvatarStack: { alignItems: 'center', flexDirection: 'row' },
    locationAvatar: {
      borderColor: colors.surface,
      borderRadius: 15,
      borderWidth: 2,
      height: 30,
      width: 30,
    },
    locationAvatarOverlap: { marginLeft: -9 },
    locationAvatarFallback: {
      alignItems: 'center',
      backgroundColor: colors.tealDark,
      justifyContent: 'center',
    },
    locationAvatarMore: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      justifyContent: 'center',
    },
    locationAvatarInitials: {
      color: '#fffaf5',
      fontFamily: FONTS.primaryBold,
      fontSize: 8,
    },
    locationHistorySummaryText: {
      color: colors.tealDark,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      letterSpacing: 0.5,
      marginLeft: 9,
    },
    locationHistoryChevron: {
      color: colors.primary,
      fontFamily: FONTS.primaryBold,
      fontSize: 16,
      marginLeft: 7,
      marginTop: -3,
    },
    locationHistoryTitle: {
      color: colors.tealDark,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      letterSpacing: 0.6,
      marginBottom: 6,
    },
    locationHistoryText: {
      color: colors.text,
      fontFamily: FONTS.primary,
      fontSize: 10,
      lineHeight: 16,
    },
    locationHistoryLoading: {
      color: colors.muted,
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
    participantName: { color: colors.text, flex: 1, fontFamily: FONTS.primary, fontSize: 11 },
    aboutTitle: {
      color: colors.black,
      fontFamily: FONTS.secondaryLight,
      fontSize: 19,
      marginBottom: 10,
      marginTop: 4,
    },
    description: {
      color: colors.text,
      fontFamily: FONTS.primary,
      fontSize: 11,
      lineHeight: 20,
      marginBottom: 12,
    },
    modalActions: { flexDirection: 'row', marginTop: 18 },
    inviteNotice: {
      color: colors.tealDark,
      fontFamily: FONTS.primaryBold,
      fontSize: 11,
      marginTop: 10,
    },
    primaryAction: {
      alignItems: 'center',
      backgroundColor: colors.primary,
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
      borderColor: colors.primary,
      borderWidth: 2,
      flex: 1,
      justifyContent: 'center',
      minHeight: 38,
      margin: 2,
    },
    secondaryActionText: {
      color: colors.text,
      fontFamily: FONTS.primary,
      fontSize: 11,
      fontWeight: '700',
    },
    deleteAction: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
    deleteActionText: {
      color: colors.primary,
      fontFamily: FONTS.primaryBold,
      fontSize: 10,
      letterSpacing: 0.8,
    },
  });
}
