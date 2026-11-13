import { render } from '@testing-library/react-native';
import { describe, expect, jest, test } from '@jest/globals';

import type { Hangout } from '../../api/hangoutsApi';
import HangoutCard, { formatUpcomingLabel } from '../../components/scheduling/HangoutCard';

const baseHangout: Hangout = {
  authHangoutId: 'hangout-id',
  createdAt: '2020-01-01T00:00:00.000Z',
  description: '',
  endTime: '2020-01-01T02:00:00.000Z',
  hangoutName: 'coffee',
  id: 'id',
  invitedAuthUserIds: [],
  isOpen: false,
  location: 'Corner Cafe',
  participantAuthUserIds: ['user-id'],
  startTime: '2020-01-01T01:00:00.000Z',
  updatedAt: '2020-01-01T00:00:00.000Z',
};

describe('HangoutCard', () => {
  test('labels a completed hangout as passed', () => {
    const { getByText } = render(<HangoutCard hangout={baseHangout} onPress={jest.fn()} />);

    expect(getByText('HANGOUT PASSED')).toBeTruthy();
  });

  test('does not label a future hangout as passed', () => {
    const futureHangout = {
      ...baseHangout,
      endTime: '2999-01-01T02:00:00.000Z',
      startTime: '2999-01-01T01:00:00.000Z',
    };
    const { queryByText } = render(<HangoutCard hangout={futureHangout} onPress={jest.fn()} />);

    expect(queryByText('HANGOUT PASSED')).toBeNull();
  });

  test('shows an hourly countdown when a hangout starts within a day', () => {
    const startTime = new Date(Date.now() + 90 * 60 * 1000);
    const futureHangout = {
      ...baseHangout,
      endTime: new Date(startTime.getTime() + 60 * 60 * 1000).toISOString(),
      startTime: startTime.toISOString(),
    };
    const { getByText } = render(<HangoutCard hangout={futureHangout} onPress={jest.fn()} />);

    expect(getByText('IN 2 HOURS!')).toBeTruthy();
  });

  test('counts tomorrow as one calendar day even when it is more than 24 hours away', () => {
    const now = new Date(2026, 10, 13, 9).getTime();
    const tomorrowEvening = new Date(2026, 10, 14, 20).toISOString();

    expect(formatUpcomingLabel(tomorrowEvening, now)).toBe('IN 1 DAY!');
  });
});
