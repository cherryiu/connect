import { describe, expect, test } from '@jest/globals';

import {
  createHangout,
  deleteHangout,
  getHangoutsForUser,
  joinHangout,
} from '../api/hangoutsApi';
import { getAuthStatus, submitAuthCredentials } from '../api/authApi';
import { getFriends } from '../api/usersApi';

describe('in-memory API', () => {
  test('authenticates and retains a newly created hangout for the current session', async () => {
    await submitAuthCredentials('mock@coze.local', 'password');
    const auth = await getAuthStatus();

    expect(auth.authenticated).toBe(true);
    expect(auth.authUserId).toBe('mock-user-1');

    const friends = await getFriends();
    expect(friends).toHaveLength(4);

    const created = await createHangout({
      description: 'Created in the mock API test',
      endTime: '2026-08-20T18:00:00.000Z',
      hangoutName: 'mock movie night',
      isOpen: true,
      invitedAuthUserIds: [friends[0].authUserId],
      location: 'Mock Theater',
      participantAuthUserIds: ['mock-user-1'],
      startTime: '2026-08-20T16:00:00.000Z',
    });
    const hangouts = await getHangoutsForUser('mock-user-1');

    expect(hangouts).toContainEqual(created);
    await expect(getHangoutsForUser(friends[0].authUserId)).resolves.toContainEqual(created);

    const joined = await joinHangout(created.authHangoutId, friends[0].authUserId);
    expect(joined.participantAuthUserIds).toContain(friends[0].authUserId);
    expect(joined.invitedAuthUserIds).not.toContain(friends[0].authUserId);

    await deleteHangout(created.authHangoutId);
    await expect(getHangoutsForUser('mock-user-1')).resolves.not.toContainEqual(joined);
  });
});
