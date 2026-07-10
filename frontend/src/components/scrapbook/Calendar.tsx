import DateTimePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../constants';

export function Calendar() {
  const today = new Date();
  const defaultStyles = useDefaultStyles();
  const [selectedDate, setSelectedDate] = useState<DateType>();

  return (
    <View style={styles.calendarContainer}>
      <DateTimePicker
        styles={{
          ...defaultStyles,
          today: { borderColor: COLORS.teal, borderWidth: 1 }, // Add a border to today's date
          selected: { backgroundColor: COLORS.yellow }, // Highlight the selected day
          selected_label: { fontFamily: FONTS.primaryBold }, // Highlight the selected day label
        }}
        mode="single"
        date={selectedDate}
        onChange={({ date }) => setSelectedDate(date)}
        minDate={today} // Set the minimum selectable date to today
      />
    </View>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: COLORS.placeholder,
    borderColor: COLORS.teal,
    borderWidth: 4,
    padding: 12,
    borderRadius: 6,
  },
});
