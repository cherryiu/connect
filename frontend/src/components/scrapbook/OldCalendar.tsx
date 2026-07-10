import { COLORS } from '../../constants';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type CalendarDay = {
  day: number;
  muted?: boolean;
  selected?: boolean;
  icon?: string;
};

const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const calendarDays: CalendarDay[] = [24, 25, 26, 27, 28, 29, 30].map((day) => ({
  day,
  muted: true,
}));

calendarDays.push(
  { day: 1 },
  { day: 2 },
  { day: 3 },
  { day: 4 },
  { day: 5 },
  { day: 6 },
  { day: 7 },
  { day: 8 },
  { day: 9 },
  { day: 10 },
  { day: 11 },
  { day: 12 },
  { day: 13 },
  { day: 14 },
  { day: 15 },
);

export default function CalendarGrid() {
  return (
    <View style={styles.calendarCard}>
      <View style={styles.weekdayRow}>
        {weekdays.map((day) => (
          <Text key={day} style={styles.weekdayText}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {calendarDays.map((day, index) => (
          <CalendarDayCell key={`${day.day}-${index}`} day={day} />
        ))}
      </View>
    </View>
  );
}

function CalendarDayCell({ day }: { day: CalendarDay }) {
  return (
    <Pressable style={[styles.dayCell, day.selected ? styles.selectedDayCell : null]}>
      <Text
        style={[
          styles.dayText,
          day.muted ? styles.mutedDayText : null,
          day.selected ? styles.selectedDayText : null,
        ]}
      >
        {day.day}
      </Text>
      {day.icon ? <Text style={styles.dayIcon}>{day.icon}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dayCell: {
    alignItems: 'center',
    aspectRatio: 1,
    borderColor: COLORS.mutedBorder,
    borderWidth: 1,
    justifyContent: 'center',
    position: 'relative',
    width: `${100 / 7}%`,
  },
  selectedDayCell: {
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.teal,
    borderWidth: 2,
  },
  dayText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  mutedDayText: {
    color: 'rgba(85, 66, 65, 0.3)',
  },
  selectedDayText: {
    fontWeight: '900',
  },
  dayIcon: {
    color: COLORS.tealDark,
    fontSize: 12,
    position: 'absolute',
    right: 4,
    top: 2,
  },
  calendarCard: {
    backgroundColor: COLORS.placeholder,
    borderColor: COLORS.teal,
    borderWidth: 4,
    padding: 12,
  },
  weekdayRow: {
    borderBottomColor: COLORS.teal,
    borderBottomWidth: 2,
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    color: COLORS.muted,
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 8,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
