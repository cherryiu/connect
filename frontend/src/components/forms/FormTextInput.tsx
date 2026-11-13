// frontend/src/components/forms/FormTextInput.tsx
import React from 'react';
import { Text, TextInput, View, StyleSheet, TextInputProps } from 'react-native';
import { COLORS, FONTS } from '../../constants';

type Props = Omit<TextInputProps, 'style'> & {
  title: string;
  error?: string;
  touched?: boolean;
  variant?: 'login' | 'hangout';
};

export default function FormTextInput({
  title,
  error,
  touched,
  variant = 'login',
  multiline,
  ...inputProps
}: Props) {
  const isHangout = variant === 'hangout';

  return (
    <View style={isHangout ? styles.hangoutField : styles.loginField}>
      <Text style={isHangout ? styles.hangoutTitle : styles.loginTitle}>{title}</Text>
      {isHangout ? (
        <TextInput
          autoCapitalize="sentences"
          multiline={multiline}
          placeholderTextColor="rgba(85,66,65,0.42)"
          style={[styles.hangoutInput, multiline && styles.multilineInput]}
          {...inputProps}
        />
      ) : (
        <View
          style={[
            styles.loginInputContainer,
            multiline ? styles.loginMultilineContainer : undefined,
            touched && error ? styles.loginInputContainerWithError : undefined,
          ]}
        >
          <TextInput
            multiline={multiline}
            placeholderTextColor="rgba(85,66,65,0.42)"
            style={[styles.loginInput, multiline && styles.loginMultilineInput]}
            {...inputProps}
          />
        </View>
      )}
      {touched && error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  loginField: { width: '100%' },
  loginTitle: {
    color: COLORS.text,
    fontFamily: FONTS.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginBottom: 7,
  },
  loginInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  loginInputContainerWithError: { marginBottom: 6 },
  loginMultilineContainer: { height: 96 },
  loginInput: {
    flex: 1,
    height: '100%',
    fontFamily: FONTS.secondary,
    fontSize: 15,
    color: COLORS.black,
  },
  loginMultilineInput: { paddingVertical: 12, textAlignVertical: 'top' },
  hangoutField: { marginBottom: 18 },
  hangoutTitle: {
    color: COLORS.text,
    fontFamily: FONTS.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginBottom: 7,
  },
  hangoutInput: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderColor: COLORS.teal,
    borderWidth: 1.5,
    color: COLORS.black,
    fontFamily: FONTS.secondary,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multilineInput: { minHeight: 120, textAlignVertical: 'top' },
  errorText: {
    alignSelf: 'flex-start',
    color: COLORS.primary,
    fontFamily: FONTS.primary,
    fontSize: 11,
    marginBottom: 10,
  },
});
