import { describe, expect, test } from '@jest/globals';

import { createHangout, deleteHangout, getHangoutsForUser, joinHangout } from '../api/hangoutsApi';
import { getAuthStatus, submitAuthCredentials } from '../api/authApi';
import {
  confirmLocationVisitAttendance,
  createStandaloneLocationOrder,
  deleteLocationVisit,
  deleteStandaloneLocationOrder,
  getFriendLocationVisits,
  getLocationVisitHistory,
  getPendingLocationVisits,
  getUserLocationVisits,
  syncLocationVisits,
  updateLocationVisitJournal,
  updateStandaloneLocationOrder,
} from '../api/locationApi';
import {
  addFriend,
  getCurrentUser,
  getFriends,
  getUserProfile,
  searchUsers,
  updateCurrentUser,
} from '../api/usersApi';

describe('in-memory API', () => {
  test('authenticates and retains a newly created hangout for the current session', async () => {
    await submitAuthCredentials('mock@coze.local', 'password');
    const auth = await getAuthStatus();

    expect(auth.authenticated).toBe(true);
    expect(auth.authUserId).toBe('mock-user-1');

    await expect(
      updateCurrentUser({
        avatarUrl: 'data:image/png;base64,YQ==',
        bio: 'Updated profile bio.',
        displayName: 'Updated Mock User',
        email: 'mock@coze.local',
        role: 'USER',
      }),
    ).resolves.toMatchObject({
      avatarUrl: 'data:image/png;base64,YQ==',
      bio: 'Updated profile bio.',
      displayName: 'Updated Mock User',
    });
    await expect(getCurrentUser()).resolves.toMatchObject({ displayName: 'Updated Mock User' });
    await expect(getAuthStatus()).resolves.toMatchObject({
      avatarUrl: 'data:image/png;base64,YQ==',
      displayName: 'Updated Mock User',
    });

    const friends = await getFriends();
    expect(friends).toHaveLength(4);
    await expect(getUserProfile(friends[0].authUserId)).resolves.toMatchObject({
      displayName: friends[0].displayName,
      id: friends[0].authUserId,
    });

    const searchResults = await searchUsers('jules');
    expect(searchResults).toEqual([
      expect.objectContaining({ authUserId: 'mock-user-jules', displayName: 'Jules Martin' }),
    ]);
    await addFriend(searchResults[0].authUserId);
    await expect(getFriends()).resolves.toContainEqual(searchResults[0]);
    await expect(searchUsers('jules')).resolves.toEqual([]);

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

    const firstSync = await syncLocationVisits();
    expect(firstSync.visitsRecorded).toBeGreaterThanOrEqual(2);
    await expect(syncLocationVisits()).resolves.toMatchObject({ visitsRecorded: 0 });
    await expect(getUserLocationVisits('mock-user-1')).resolves.toContainEqual(
      expect.objectContaining({ location: 'Mock Theater', visitCount: 1 }),
    );
    await expect(getLocationVisitHistory('mock-user-1', 'Local Good Coffee Co.')).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          orderDescription: 'Iced oat latte + blueberry scone',
          orderRating: 4,
        }),
      ]),
    );
    await expect(getPendingLocationVisits('mock-user-1')).resolves.toContainEqual(
      expect.objectContaining({ authHangoutId: created.authHangoutId, location: 'Mock Theater' }),
    );
    await expect(
      updateLocationVisitJournal('mock-user-1', created.authHangoutId, {
        notes: 'Great seats.',
        orderDescription: 'Popcorn',
        orderRating: 5,
      }),
    ).resolves.toMatchObject({
      notes: 'Great seats.',
      orderDescription: 'Popcorn',
      orderRating: 5,
    });
    await confirmLocationVisitAttendance('mock-user-1', created.authHangoutId, true);
    await expect(getPendingLocationVisits('mock-user-1')).resolves.not.toContainEqual(
      expect.objectContaining({ authHangoutId: created.authHangoutId }),
    );
    const declinedVisit = (await getPendingLocationVisits('mock-user-1')).find(
      (visit) => visit.location === 'Local Good Coffee Co.',
    );
    expect(declinedVisit).toBeDefined();
    await confirmLocationVisitAttendance('mock-user-1', declinedVisit!.authHangoutId, false);
    await syncLocationVisits();
    await expect(getPendingLocationVisits('mock-user-1')).resolves.not.toContainEqual(
      expect.objectContaining({ authHangoutId: declinedVisit!.authHangoutId }),
    );
    await expect(
      getLocationVisitHistory('mock-user-1', 'Local Good Coffee Co.'),
    ).resolves.not.toContainEqual(
      expect.objectContaining({ authHangoutId: declinedVisit!.authHangoutId }),
    );
    const standaloneOrder = await createStandaloneLocationOrder('mock-user-1', {
      location: 'Local Good Coffee Co.',
      notes: 'Quick takeout order.',
      orderDescription: 'Matcha latte',
      orderRating: 4,
    });
    expect(standaloneOrder).toMatchObject({
      orderDescription: 'Matcha latte',
      standaloneOrder: true,
    });
    await expect(
      updateStandaloneLocationOrder('mock-user-1', standaloneOrder.entryId, {
        notes: 'Get it with less sugar.',
        orderDescription: 'Iced matcha latte',
        orderRating: 5,
      }),
    ).resolves.toMatchObject({ orderDescription: 'Iced matcha latte', orderRating: 5 });
    await expect(
      getLocationVisitHistory('mock-user-1', 'Local Good Coffee Co.'),
    ).resolves.toContainEqual(
      expect.objectContaining({ entryId: standaloneOrder.entryId, standaloneOrder: true }),
    );
    await deleteStandaloneLocationOrder('mock-user-1', standaloneOrder.entryId);
    await expect(
      getLocationVisitHistory('mock-user-1', 'Local Good Coffee Co.'),
    ).resolves.not.toContainEqual(expect.objectContaining({ entryId: standaloneOrder.entryId }));
    await expect(
      getFriendLocationVisits('Mock Theater', [friends[0].authUserId]),
    ).resolves.toContainEqual(
      expect.objectContaining({ authUserId: friends[0].authUserId, visitCount: 1 }),
    );

    await deleteLocationVisit('mock-user-1', created.authHangoutId);
    await syncLocationVisits();
    await expect(getUserLocationVisits('mock-user-1')).resolves.not.toContainEqual(
      expect.objectContaining({ location: 'Mock Theater' }),
    );

    await deleteHangout(created.authHangoutId);
    await expect(getHangoutsForUser('mock-user-1')).resolves.not.toContainEqual(joined);
  });
});
