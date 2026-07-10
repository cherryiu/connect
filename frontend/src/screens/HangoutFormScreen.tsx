import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { createHangout, Hangout, HangoutRequest, updateHangout } from '../api/hangoutsApi';
import { COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Hangout Form'>;

export default function HangoutFormScreen({ navigation, route }: Props) {
  const existing = route.params?.hangout;
  const { user } = useAuth();
  const initial = useMemo(() => getInitialValues(existing), [existing]);
  const [name, setName] = useState(initial.name);
  const [location, setLocation] = useState(initial.location);
  const [date, setDate] = useState(initial.date);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [description, setDescription] = useState(initial.description);
  const [isOpen, setIsOpen] = useState(initial.isOpen);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim() || !date.trim() || !startTime.trim() || !endTime.trim()) {
      setError('Add a name, date, start time, and end time.');
      return;
    }
    if (!user?.authUserId && !existing) {
      setError('Sign in before creating a hangout.');
      return;
    }

    const start = parseLocalDateTime(date, startTime);
    const end = parseLocalDateTime(date, endTime);
    if (!start || !end || end <= start) {
      setError('Use YYYY-MM-DD and 24-hour time. The end must be after the start.');
      return;
    }

    const participantIds = existing?.participantAuthUserIds ?? [user?.authUserId].filter(isString);
    const body: HangoutRequest = {
      participantAuthUserIds: participantIds,
      hangoutName: name.trim(),
      location: location.trim(),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      description: description.trim(),
      isOpen,
    };

    try {
      setSaving(true);
      setError(null);
      if (existing) await updateHangout(existing.authHangoutId, body);
      else await createHangout(body);
      navigation.goBack();
    } catch {
      setError('The hangout could not be saved. Check the service and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back to calendar" hitSlop={10} onPress={navigation.goBack}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{existing ? 'EDIT HANG' : 'NEW HANG'}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.kicker}>✧ make a plan</Text>
          <Text style={styles.title}>{existing ? 'change the details' : 'what are we doing?'}</Text>

          <Field
            label="HANG NAME"
            onChangeText={setName}
            placeholder="study session"
            value={name}
          />
          <Field
            label="LOCATION"
            onChangeText={setLocation}
            placeholder="local good coffee co"
            value={location}
          />

          <View style={styles.row}>
            <View style={styles.dateField}>
              <Field label="DATE" onChangeText={setDate} placeholder="2026-07-10" value={date} />
            </View>
            <View style={styles.timeField}>
              <Field
                label="START"
                onChangeText={setStartTime}
                placeholder="15:00"
                value={startTime}
              />
            </View>
            <View style={styles.timeField}>
              <Field label="END" onChangeText={setEndTime} placeholder="17:00" value={endTime} />
            </View>
          </View>

          <Field
            label="ABOUT THIS HANG"
            multiline
            onChangeText={setDescription}
            placeholder="tell everyone what the plan is..."
            value={description}
          />

          <View style={styles.openRow}>
            <View style={styles.openCopy}>
              <Text style={styles.fieldLabel}>OPEN HANG</Text>
              <Text style={styles.helpText}>Friends can ask to join this plan.</Text>
            </View>
            <Switch
              onValueChange={setIsOpen}
              thumbColor="#fffaf5"
              trackColor={{ false: '#cfc6bd', true: COLORS.teal }}
              value={isOpen}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable disabled={saving} onPress={() => void save()} style={styles.saveButton}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{existing ? 'SAVE CHANGES' : 'CREATE HANG'}</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  multiline = false,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; multiline?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize="sentences"
        multiline={multiline}
        placeholderTextColor="rgba(85,66,65,0.42)"
        style={[styles.input, multiline && styles.multilineInput]}
        {...props}
      />
    </View>
  );
}

function getInitialValues(existing?: Hangout) {
  const start = existing ? new Date(existing.startTime) : tomorrowAt(15);
  const end = existing ? new Date(existing.endTime) : tomorrowAt(17);
  return {
    name: existing?.hangoutName ?? '',
    location: existing?.location ?? '',
    date: formatInputDate(start),
    startTime: formatInputTime(start),
    endTime: formatInputTime(end),
    description: existing?.description ?? '',
    isOpen: existing?.isOpen ?? true,
  };
}

function tomorrowAt(hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatInputTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function parseLocalDateTime(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isString(value: string | null | undefined): value is string {
  return typeof value === 'string';
}

const MONO = 'Courier New';

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#fbf5ef', flex: 1 },
  screen: { backgroundColor: '#fbf5ef', flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomColor: COLORS.teal,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 66,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  back: { color: COLORS.primary, fontSize: 38, lineHeight: 40 },
  headerTitle: { color: COLORS.primary, fontFamily: MONO, fontSize: 16, fontWeight: '700' },
  headerSpacer: { width: 22 },
  content: { padding: 22, paddingBottom: 60 },
  kicker: { color: COLORS.coral, fontFamily: MONO, fontSize: 15, fontWeight: '700' },
  title: { color: '#211e1c', fontFamily: MONO, fontSize: 28, marginBottom: 28, marginTop: 8 },
  field: { marginBottom: 18 },
  fieldLabel: {
    color: COLORS.text,
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginBottom: 7,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderColor: COLORS.teal,
    borderWidth: 1.5,
    color: '#211e1c',
    fontFamily: MONO,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multilineInput: { minHeight: 120, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  dateField: { flex: 1.6, marginRight: 8 },
  timeField: { flex: 1, marginRight: 8 },
  openRow: {
    alignItems: 'center',
    borderColor: COLORS.teal,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    padding: 14,
  },
  openCopy: { flex: 1 },
  helpText: { color: COLORS.text, fontFamily: MONO, fontSize: 10 },
  error: {
    backgroundColor: 'rgba(156,65,65,0.10)',
    color: COLORS.primary,
    fontFamily: MONO,
    fontSize: 11,
    marginBottom: 14,
    padding: 12,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    minHeight: 50,
  },
  saveButtonText: {
    color: '#fff',
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
});
