import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LocationVisitSummary } from '../../api/locationApi';
import { FONTS } from '../../constants';
import { useTheme, type AppColors } from '../../context/ThemeContext';

type Props = {
  onPress: () => void;
  place: LocationVisitSummary;
};

/** A compact place summary that opens the full, per-visit journal. */
export default function VisitedPlaceCard({ onPress, place }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      accessibilityHint="Opens this place's visit history"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.headingRow}>
        <Text numberOfLines={2} style={styles.name}>
          {place.location}
        </Text>
        <View style={styles.cardAction}>
          <View style={styles.countBadge}>
            <Text style={styles.count}>{place.visitCount}×</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </View>
      </View>

      <View style={styles.divider} />
      <Text style={styles.metadata}>
        {place.visitCount === 1 ? '1 VISIT' : `${place.visitCount} VISITS`}
      </Text>
      <Text style={styles.lastVisited}>LAST VISITED {formatVisitDate(place.lastVisitedAt)}</Text>
    </Pressable>
  );
}

function formatVisitDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'UNKNOWN';
  return date
    .toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase();
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.tealDark,
      borderRadius: 7,
      borderWidth: 1.5,
      marginBottom: 14,
      padding: 18,
      shadowColor: colors.teal,
      shadowOffset: { height: 4, width: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 0,
    },
    headingRow: { alignItems: 'flex-start', flexDirection: 'row' },
    pressed: { opacity: 0.62 },
    name: {
      color: colors.black,
      flex: 1,
      fontFamily: FONTS.secondaryBold,
      fontSize: 21,
      lineHeight: 25,
      textTransform: 'lowercase',
    },
    countBadge: {
      alignItems: 'center',
      backgroundColor: colors.yellow,
      borderColor: colors.black,
      borderRadius: 18,
      borderWidth: 1,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    count: { color: colors.black, fontFamily: FONTS.primaryBold, fontSize: 11 },
    cardAction: { alignItems: 'center', flexDirection: 'row', marginLeft: 12 },
    arrow: { color: colors.primary, fontFamily: FONTS.secondaryLight, fontSize: 30, marginLeft: 8 },
    divider: { backgroundColor: colors.teal, height: 1, marginVertical: 14 },
    metadata: {
      color: colors.primary,
      fontFamily: FONTS.primaryBold,
      fontSize: 10,
      letterSpacing: 0.8,
    },
    lastVisited: {
      color: colors.muted,
      fontFamily: FONTS.primary,
      fontSize: 9,
      letterSpacing: 0.4,
      marginTop: 5,
    },
  });
}
