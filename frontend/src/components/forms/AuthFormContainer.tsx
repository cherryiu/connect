import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { GlassContainer, GlassView } from 'expo-glass-effect';

import { COLORS, FONTS } from '../../constants';

type Props = {
  children: ReactNode;
  error?: string;
  isSubmitDisabled?: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  onSwitch: () => void;
  submitLabel: string;
  submittingLabel: string;
  success?: string;
  switchLabel: string;
  switchPrompt: string;
  testID?: string;
  title: string;
};

export default function AuthFormContainer({
  children,
  error,
  isSubmitDisabled = false,
  isSubmitting,
  onSubmit,
  onSwitch,
  submitLabel,
  submittingLabel,
  success,
  switchLabel,
  switchPrompt,
  testID,
  title,
}: Props) {
  return (
    <GlassContainer style={styles.container} testID={testID}>
      <GlassView style={styles.glassView} isInteractive glassEffectStyle="clear">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{title}</Text>
          {success ? <Text style={styles.success}>{success}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {children}
          <Pressable
            disabled={isSubmitting || isSubmitDisabled}
            onPress={onSubmit}
            style={[styles.button, (isSubmitting || isSubmitDisabled) && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>{isSubmitting ? submittingLabel : submitLabel}</Text>
          </Pressable>
          <Pressable disabled={isSubmitting} onPress={onSwitch} style={styles.switchButton}>
            <Text style={styles.switchPrompt}>
              {switchPrompt} <Text style={styles.switchLabel}>{switchLabel}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </GlassView>
    </GlassContainer>
  );
}

const message = {
  fontFamily: FONTS.primary,
  fontSize: 11,
  marginBottom: 14,
  padding: 12,
} as const;

const styles = StyleSheet.create({
  container: { flex: 1 },
  glassView: { flex: 1, margin: 20, borderRadius: 20 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: COLORS.black,
    fontFamily: FONTS.secondaryItalic,
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 40,
    marginTop: 40,
    textAlign: 'center',
  },
  error: { ...message, backgroundColor: 'rgba(156,65,65,0.10)', color: COLORS.primary },
  success: { ...message, backgroundColor: 'rgba(61,125,112,0.12)', color: COLORS.teal },
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    height: 45,
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 20,
    width: '100%',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontFamily: FONTS.primary, fontSize: 14 },
  switchButton: { alignItems: 'center', padding: 8 },
  switchPrompt: { color: COLORS.text, fontFamily: FONTS.secondary, fontSize: 13 },
  switchLabel: { color: COLORS.primary, fontFamily: FONTS.primary, fontWeight: '700' },
});
