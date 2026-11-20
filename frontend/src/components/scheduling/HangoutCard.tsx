import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Hangout } from '../../api/hangoutsApi';
import { FONTS } from '../../constants';
import { useTheme, type AppColors } from '../../context/ThemeContext';

type Props = {
  hangout: Hangout;
  onPress: () => void;
};

export default function HangoutCard({ hangout, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hasPassed = Date.parse(hangout.endTime) < Date.now();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.card, hasPassed && styles.passedCard]}
    >
      <View style={styles.badgeRow}>
        <HangoutDateBadge startTime={hangout.startTime} />
        <HangoutPassedBadge endTime={hangout.endTime} />
        <HangoutUpcomingBadge startTime={hangout.startTime} />
      </View>
      <Text numberOfLines={1} style={styles.title}>
        {hangout.hangoutName}
      </Text>
      <View style={styles.detailsRow}>
        <View style={styles.copy}>
          <Text style={styles.metadata}>❤︎ {hangout.participantAuthUserIds.length} GOING</Text>
          <Text numberOfLines={1} style={styles.metadata}>
            🌐︎ {hangout.location || 'LOCATION TBD'}
          </Text>
          <Text style={styles.metadata}>ツ HOSTED BY YOU</Text>
        </View>
        <AvatarStack count={hangout.participantAuthUserIds.length} />
      </View>
    </Pressable>
  );
}

export function HangoutDateBadge({ startTime }: { startTime: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={styles.dateBadge}>{formatDateBadge(startTime)}</Text>;
}

export function HangoutPassedBadge({ endTime }: { endTime: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (Date.parse(endTime) >= Date.now()) return null;
  return <Text style={styles.passedBadge}>HANGOUT PASSED</Text>;
}

export function HangoutUpcomingBadge({ startTime }: { startTime: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const label = formatUpcomingLabel(startTime);
  return label ? <Text style={styles.upcomingBadge}>{label}</Text> : null;
}

export function formatUpcomingLabel(startTime: string, nowTimestamp = Date.now()) {
  const start = new Date(startTime);
  const now = new Date(nowTimestamp);
  const millisecondsUntilStart = start.getTime() - now.getTime();
  if (!Number.isFinite(start.getTime()) || millisecondsUntilStart <= 0) return null;

  // Compare local calendar dates rather than rounding elapsed hours. This keeps
  // tomorrow as one day away even when the event is more than 24 hours out.
  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const calendarDaysUntilStart = Math.round((startDay - today) / (24 * 60 * 60 * 1000));

  if (calendarDaysUntilStart > 0) {
    const unit = calendarDaysUntilStart === 1 ? 'DAY' : 'DAYS';
    return `IN ${calendarDaysUntilStart} ${unit}!`;
  }

  const hoursUntilStart = Math.max(1, Math.ceil(millisecondsUntilStart / (60 * 60 * 1000)));
  return `IN ${hoursUntilStart} ${hoursUntilStart === 1 ? 'HOUR' : 'HOURS'}!`;
}

function AvatarStack({ count }: { count: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.avatarStack}>
      {Array.from({ length: Math.min(count, 3) }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.avatar,
            {
              backgroundColor: [colors.coral, '#8B7898', colors.teal][index],
              marginLeft: index ? -8 : 0,
            },
          ]}
        >
          <Text style={styles.avatarText}>{String.fromCharCode(79 + index)}</Text>
        </View>
      ))}
    </View>
  );
}

function formatDateBadge(value: string) {
  const date = new Date(value);
  const datePart = date
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    .toUpperCase();
  const timePart = date
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .replace(' ', '');
  return `${datePart} · ${timePart}`;
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      // backgroundColor: 'rgba(255,252,248,0.90)',
      borderColor: colors.tealDark,
      borderRadius: 8,
      borderWidth: 2,
      marginBottom: 16,
      padding: 16,
      shadowColor: colors.teal,
      shadowOffset: { height: 6, width: 6 },
      shadowOpacity: 0.75,
      shadowRadius: 0,
      width: '76%',
    },
    passedCard: {
      borderColor: colors.muted,
      shadowColor: colors.muted,
    },
    badgeRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    dateBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.yellow,
      borderColor: colors.teal,
      borderWidth: 1,
      color: colors.dateBadgeText,
      fontFamily: FONTS.primary,
      fontSize: 12,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    passedBadge: {
      backgroundColor: 'rgba(156,65,65,0.12)',
      borderColor: colors.primary,
      borderWidth: 1,
      color: colors.primary,
      fontFamily: FONTS.primaryBold,
      fontSize: 10,
      letterSpacing: 0.5,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    upcomingBadge: {
      backgroundColor: 'rgba(132,165,157,0.18)',
      borderColor: colors.tealDark,
      borderWidth: 1,
      color: colors.tealDark,
      fontFamily: FONTS.primaryBold,
      fontSize: 10,
      letterSpacing: 0.5,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    title: {
      color: colors.black,
      fontFamily: FONTS.secondary,
      fontSize: 24,
      marginBottom: 8,
      marginTop: 8,
      // textTransform: 'lowercase',
    },
    detailsRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    copy: { flex: 1, paddingRight: 8 },
    metadata: {
      color: colors.text,
      fontFamily: FONTS.primary,
      fontSize: 11.5,
      letterSpacing: 1.2,
      lineHeight: 20,
      textTransform: 'uppercase',
    },
    avatarStack: { flexDirection: 'row', paddingTop: 4 },
    avatar: {
      alignItems: 'center',
      borderColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      height: 25,
      justifyContent: 'center',
      width: 25,
    },
    avatarText: { color: '#fff', fontSize: 10 },
  });
}
