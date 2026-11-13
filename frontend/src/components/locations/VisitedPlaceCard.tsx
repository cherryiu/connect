import { StyleSheet, Text, View } from 'react-native';

import type { LocationVisitSummary } from '../../api/locationApi';
import { COLORS, FONTS } from '../../constants';

type Props = {
  place: LocationVisitSummary;
};

/**
 * The base card for a place log. Future fields such as an image, rating, and
 * order details belong here without changing the Logs screen's data flow.
 */
export default function VisitedPlaceCard({ place }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <Text numberOfLines={2} style={styles.name}>
          {place.location}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.count}>{place.visitCount}×</Text>
        </View>
      </View>

      <View style={styles.divider} />
      <Text style={styles.metadata}>
        {place.visitCount === 1 ? '1 VISIT' : `${place.visitCount} VISITS`}
      </Text>
      <Text style={styles.lastVisited}>LAST VISITED {formatVisitDate(place.lastVisitedAt)}</Text>
    </View>
  );
}

function formatVisitDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'UNKNOWN';
  return date
    .toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase();
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.46)',
    borderColor: COLORS.tealDark,
    borderRadius: 7,
    borderWidth: 1.5,
    marginBottom: 14,
    padding: 18,
    shadowColor: COLORS.teal,
    shadowOffset: { height: 4, width: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 0,
  },
  headingRow: { alignItems: 'flex-start', flexDirection: 'row' },
  name: {
    color: COLORS.black,
    flex: 1,
    fontFamily: FONTS.secondaryBold,
    fontSize: 21,
    lineHeight: 25,
    textTransform: 'lowercase',
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.black,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginLeft: 12,
    width: 36,
  },
  count: { color: COLORS.black, fontFamily: FONTS.primaryBold, fontSize: 11 },
  divider: { backgroundColor: COLORS.teal, height: 1, marginVertical: 14 },
  metadata: {
    color: COLORS.primary,
    fontFamily: FONTS.primaryBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  lastVisited: {
    color: COLORS.muted,
    fontFamily: FONTS.primary,
    fontSize: 9,
    letterSpacing: 0.4,
    marginTop: 5,
  },
});
