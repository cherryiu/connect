import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Hangout } from '../../api/hangoutsApi';
import { COLORS, FONTS } from '../../constants';

type Props = {
  hangout: Hangout;
  onPress: () => void;
};

export default function HangoutCard({ hangout, onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <HangoutDateBadge startTime={hangout.startTime} />
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
  return <Text style={styles.dateBadge}>{formatDateBadge(startTime)}</Text>;
}

function AvatarStack({ count }: { count: number }) {
  return (
    <View style={styles.avatarStack}>
      {Array.from({ length: Math.min(count, 3) }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.avatar,
            {
              backgroundColor: [COLORS.coral, '#c89cff', '#8dded1'][index],
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    // backgroundColor: 'rgba(255,252,248,0.90)',
    borderColor: COLORS.tealDark,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 16,
    padding: 16,
    shadowColor: COLORS.teal,
    shadowOffset: { height: 6, width: 6 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    width: '76%',
  },
  dateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.teal,
    borderWidth: 1,
    color: '#211e1c',
    fontFamily: FONTS.primary,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  title: {
    color: '#211e1c',
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
    color: COLORS.text,
    fontFamily: FONTS.primary,
    fontSize: 11.5,
    letterSpacing: 1.2,
    lineHeight: 20,
    textTransform: 'uppercase',
  },
  avatarStack: { flexDirection: 'row', paddingTop: 4 },
  avatar: {
    alignItems: 'center',
    borderColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    height: 25,
    justifyContent: 'center',
    width: 25,
  },
  avatarText: { color: '#fff', fontSize: 10 },
});
