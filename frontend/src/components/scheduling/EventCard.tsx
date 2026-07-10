import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../../constants';

type NextHangoutCardProps = {
  date?: string;
  location?: string;
  onPress?: () => void;
  title?: string;
};

export function NextHangoutCard({
  date = 'TOMORROW · 3:00 PM',
  location = 'LOCATION TBD',
  onPress,
  title = 'Coffee & Catch-up',
}: NextHangoutCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Text style={styles.date}>{date}</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.details}>
        <Text style={styles.metadata}>♧ {location}</Text>
        <Text style={styles.metadata}>◉ HOSTED BY YOU</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fffaf5',
    borderColor: COLORS.tealDark,
    borderRadius: 8,
    borderWidth: 2,
    padding: 16,
  },
  date: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.yellow,
    color: COLORS.text,
    fontFamily: 'Courier New',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  title: {
    color: COLORS.text,
    fontFamily: 'Courier New',
    fontSize: 22,
    marginVertical: 10,
  },
  details: { gap: 4 },
  metadata: {
    color: COLORS.text,
    fontFamily: 'Courier New',
    fontSize: 10,
    textTransform: 'uppercase',
  },
});
