import React, { useEffect, useMemo, useState } from 'react';
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
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Formik } from 'formik';
import * as yup from 'yup';

import { createHangout, Hangout, HangoutRequest, updateHangout } from '../api/hangoutsApi';
import { COLORS, FONTS } from '../constants';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import FormTextInput from '../components/forms/FormTextInput';
import FriendSelector from '../components/forms/FriendSelector';
import { getFriends, type FriendProfile } from '../api/usersApi';

type HangoutFormNavigation = NativeStackNavigationProp<RootStackParamList, 'HangoutForm'>;
type HangoutFormRoute = RouteProp<RootStackParamList, 'HangoutForm'>;

type HangoutFormValues = {
  name: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  friendAuthUserIds: string[];
  isOpen: boolean;
};

const hangoutValidationSchema = yup.object({
  name: yup.string().trim().required('Add a hang name.'),
  location: yup.string(),
  date: yup
    .string()
    .required('Add a date.')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD for the date.'),
  startTime: yup
    .string()
    .required('Add a start time.')
    .matches(/^\d{2}:\d{2}$/, 'Use 24-hour time for the start.'),
  endTime: yup
    .string()
    .required('Add an end time.')
    .matches(/^\d{2}:\d{2}$/, 'Use 24-hour time for the end.'),
  description: yup.string(),
  friendAuthUserIds: yup.array().of(yup.string().required()).required(),
  isOpen: yup.boolean().required(),
});

export default function HangoutFormScreen() {
  const navigation = useNavigation<HangoutFormNavigation>();
  const route = useRoute<HangoutFormRoute>();
  const existing = route.params?.hangout;
  const { user } = useAuth();
  const initial = useMemo(
    () => getInitialValues(existing, user?.authUserId),
    [existing, user?.authUserId],
  );
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendsError, setFriendsError] = useState<string>();

  useEffect(() => {
    let active = true;
    getFriends()
      .then((result) => {
        if (active) setFriends(result);
      })
      .catch(() => {
        if (active) setFriendsError('Friends could not be loaded.');
      })
      .finally(() => {
        if (active) setFriendsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async (values: HangoutFormValues, setStatus: (status?: string) => void) => {
    if (!user?.authUserId && !existing) {
      setStatus('Sign in before creating a hangout.');
      return;
    }

    const start = parseLocalDateTime(values.date, values.startTime);
    const end = parseLocalDateTime(values.date, values.endTime);
    if (!start || !end || end <= start) {
      setStatus('Use a valid date and time. The end must be after the start.');
      return;
    }

    const participantIds = Array.from(
      new Set([user?.authUserId, ...values.friendAuthUserIds].filter(isString)),
    );
    const body: HangoutRequest = {
      participantAuthUserIds: participantIds,
      hangoutName: values.name.trim(),
      location: values.location.trim(),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      description: values.description.trim(),
      isOpen: values.isOpen,
    };

    try {
      setStatus(undefined);
      if (existing) await updateHangout(existing.authHangoutId, body);
      else await createHangout(body);
      navigation.goBack();
    } catch {
      setStatus('The hangout could not be saved. Check the service and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Back to calendar"
            hitSlop={10}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{existing ? 'EDIT HANG' : 'NEW HANG'}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Formik<HangoutFormValues>
          enableReinitialize
          initialValues={initial}
          validationSchema={hangoutValidationSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            try {
              await save(values, setStatus);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({
            errors,
            handleBlur,
            handleChange,
            handleSubmit,
            isSubmitting,
            setFieldValue,
            status,
            touched,
            values,
          }) => (
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <Text style={styles.kicker}>✧ make a plan</Text>
              <Text style={styles.title}>
                {existing ? 'change the details' : 'what are we doing?'}
              </Text>

              <FormTextInput
                title="HANG NAME"
                onBlur={handleBlur('name')}
                onChangeText={handleChange('name')}
                placeholder="study session"
                value={values.name}
                variant="hangout"
              />
              <FormTextInput
                title="LOCATION"
                onBlur={handleBlur('location')}
                onChangeText={handleChange('location')}
                placeholder="local good coffee co"
                value={values.location}
                variant="hangout"
              />

              <View style={styles.row}>
                <View style={styles.dateField}>
                  <FormTextInput
                    title="DATE"
                    onBlur={handleBlur('date')}
                    onChangeText={handleChange('date')}
                    placeholder="2026-07-10"
                    value={values.date}
                    variant="hangout"
                  />
                </View>
                <View style={styles.timeField}>
                  <FormTextInput
                    title="START"
                    onBlur={handleBlur('startTime')}
                    onChangeText={handleChange('startTime')}
                    placeholder="15:00"
                    value={values.startTime}
                    variant="hangout"
                  />
                </View>
                <View style={styles.timeField}>
                  <FormTextInput
                    title="END"
                    onBlur={handleBlur('endTime')}
                    onChangeText={handleChange('endTime')}
                    placeholder="17:00"
                    value={values.endTime}
                    variant="hangout"
                  />
                </View>
              </View>

              <FormTextInput
                title="ABOUT THIS HANG"
                multiline
                onBlur={handleBlur('description')}
                onChangeText={handleChange('description')}
                placeholder="tell everyone what the plan is..."
                value={values.description}
                variant="hangout"
              />

              <FriendSelector
                error={friendsError}
                friends={friends}
                loading={friendsLoading}
                onToggle={(authUserId) => {
                  const selected = values.friendAuthUserIds.includes(authUserId);
                  void setFieldValue(
                    'friendAuthUserIds',
                    selected
                      ? values.friendAuthUserIds.filter((id) => id !== authUserId)
                      : [...values.friendAuthUserIds, authUserId],
                  );
                }}
                selectedIds={values.friendAuthUserIds}
              />

              <View style={styles.openRow}>
                <View style={styles.openCopy}>
                  <Text style={styles.fieldLabel}>OPEN HANG</Text>
                  <Text style={styles.helpText}>Friends can ask to join this plan.</Text>
                </View>
                <Switch
                  onValueChange={(value) => void setFieldValue('isOpen', value)}
                  thumbColor="#fffaf5"
                  trackColor={{ false: '#cfc6bd', true: COLORS.teal }}
                  value={values.isOpen}
                />
              </View>

              {status ? <Text style={styles.error}>{status}</Text> : null}
              {!status && Object.keys(touched).length > 0 && Object.keys(errors).length > 0 ? (
                <Text style={styles.error}>{Object.values(errors)[0]}</Text>
              ) : null}

              <Pressable
                disabled={isSubmitting}
                onPress={() => handleSubmit()}
                style={styles.saveButton}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {existing ? 'SAVE CHANGES' : 'CREATE HANG'}
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          )}
        </Formik>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getInitialValues(existing?: Hangout, currentUserId?: string | null) {
  const start = existing ? new Date(existing.startTime) : tomorrowAt(15);
  const end = existing ? new Date(existing.endTime) : tomorrowAt(17);
  return {
    name: existing?.hangoutName ?? '',
    location: existing?.location ?? '',
    date: formatInputDate(start),
    startTime: formatInputTime(start),
    endTime: formatInputTime(end),
    description: existing?.description ?? '',
    friendAuthUserIds:
      existing?.participantAuthUserIds.filter((participantId) => participantId !== currentUserId) ??
      [],
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
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hour ||
    parsed.getMinutes() !== minute
  ) {
    return null;
  }
  return parsed;
}

function isString(value: string | null | undefined): value is string {
  return typeof value === 'string';
}

const MONO = FONTS.primary;
const SECONDARY = FONTS.secondary;

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
  title: {
    color: COLORS.black,
    fontFamily: SECONDARY,
    fontSize: 28,
    marginBottom: 28,
    marginTop: 8,
  },
  fieldLabel: {
    color: COLORS.text,
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginBottom: 7,
  },
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
    borderWidth: 1,
  },
  saveButtonText: {
    color: '#fff',
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
});
