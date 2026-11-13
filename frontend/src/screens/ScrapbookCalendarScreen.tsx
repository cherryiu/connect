import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

import { getHangoutsForUser, Hangout } from '../api/hangoutsApi';
import { COLORS, FONTS } from '../constants';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';

import TopBar from '../components/bars/TopBar';
import BottomNavBar from '../components/bars/BottomNavBar';
import HangoutCard, { HangoutDateBadge } from '../components/scheduling/HangoutCard';

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
      const result = await getHangoutsForUser(user.authUserId);
      setHangouts(result.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime)));
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
    return showAll ? future : future.slice(0, 3);
  }, [hangouts, showAll]);

  const openHangoutForm = (hangout?: Hangout) => {
    navigation.navigate('HangoutForm', hangout ? { hangout } : undefined);
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

        <BottomNavBar onCreate={() => openHangoutForm()} />

        <HangoutDetailsModal
          currentUserId={user?.authUserId}
          hangout={selectedHangout}
          onClose={() => setSelectedHangout(null)}
          onEdit={(hangout) => {
            setSelectedHangout(null);
            openHangoutForm(hangout);
          }}
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
      <Pressable accessibilityLabel="Previous month" hitSlop={8} onPress={onPrevious}>
        <Text style={styles.monthArrow}>←</Text>
      </Pressable>
      <Text style={styles.monthTitle}>
        <Text style={styles.monthName}>{month.toLocaleDateString('en-US', { month: 'long' })}</Text>{' '}
        {month.getFullYear()}
      </Text>
      <Pressable accessibilityLabel="Next month" hitSlop={8} onPress={onNext}>
        <Text style={styles.monthArrow}>→</Text>
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
              {dayHangouts.length ? <Text style={styles.hangoutMarker}>♨</Text> : null}
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
  hangout,
  onClose,
  onEdit,
}: {
  currentUserId?: string | null;
  hangout: Hangout | null;
  onClose: () => void;
  onEdit: (hangout: Hangout) => void;
}) {
  if (!hangout) return null;

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
            <HangoutDateBadge startTime={hangout.startTime} />
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
            <Text style={styles.modalMetadata}>ツ HOSTED BY YOU</Text>

            <View style={styles.modalActions}>
              <Pressable onPress={() => void openDirections()} style={styles.primaryAction}>
                <Text style={styles.primaryActionText}>DIRECTIONS</Text>
              </Pressable>
              <Pressable onPress={() => onEdit(hangout)} style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>EDIT HANG</Text>
              </Pressable>
            </View>
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
  monthArrow: {
    backgroundColor: '#050505',
    borderRadius: 15,
    color: '#fff',
    fontSize: 16,
    height: 28,
    lineHeight: 28,
    overflow: 'hidden',
    textAlign: 'center',
    width: 28,
  },
  monthTitle: { color: '#171413', fontFamily: MONO, fontSize: 32, textTransform: 'lowercase' },
  monthName: { fontWeight: '700' },
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
  modalMetadata: {
    color: COLORS.text,
    fontFamily: FONTS.primary,
    fontSize: 11,
    letterSpacing: 1.2,
    lineHeight: 23,
    textTransform: 'uppercase',
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
});
