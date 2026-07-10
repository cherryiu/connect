// frontend/src/components/forms/FormTextInput.tsx
import React from 'react';
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  KeyboardTypeOptions,
  TextInputProps,
} from 'react-native';
import { COLORS, FONTS } from '../../constants';

type Props = {
  title: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur: TextInputProps['onBlur'];
  error?: string;
  touched?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

export default function FormTextInput({
  title,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  touched,
  secureTextEntry,
  keyboardType = 'default',
}: Props) {
  return (
    <>
      <Text style={styles.inputTitle}>{title}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          onChangeText={onChangeText}
          onBlur={onBlur}
          value={value}
        />
      </View>
      {/* // handles error message */}
      {touched && error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  inputTitle: {
    fontFamily: FONTS.primary,
    fontSize: 12,
    marginBottom: 28,
    fontWeight: 'bold',
    color: COLORS.brown,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: FONTS.secondary,
    fontSize: 16,
    color: COLORS.placeholder,
  },
  errorText: {
    color: 'red',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
});
