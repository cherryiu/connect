import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { COLORS } from '../constants';

type SquareButtonProps = {
  onPress: () => void;
  title: string;
};

export default function SquareButton({ title, onPress }: SquareButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderColor: COLORS.primary,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: COLORS.text,
    fontFamily: 'Courier New',
    fontSize: 12,
    fontWeight: '700',
  },
});
