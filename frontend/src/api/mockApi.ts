import {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import type { Hangout, HangoutRequest } from './hangoutsApi';
import type { AuthStatusResponse } from './authApi';
import type { LocationVisitDetail } from './locationApi';
import type { FriendProfile, UserProfileRequest, UserProfileResponse } from './usersApi';

const MOCK_USER_ID = 'mock-user-1';
let authenticated = false;
let users: UserProfileResponse[] = [];
let hangouts: Hangout[] = createSeedHangouts();
let locationVisits: MockLocationVisit[] = [];
let standaloneOrders: MockStandaloneOrder[] = [];
let friends: FriendProfile[] = [
  {
    authUserId: 'mock-friend-ava',
    displayName: 'Ava Chen',
    email: 'ava@coze.local',
  },
  {
    authUserId: 'mock-friend-miles',
    displayName: 'Miles Brooks',
    email: 'miles@coze.local',
  },
  {
    authUserId: 'mock-friend-noor',
    displayName: 'Noor Patel',
    email: 'noor@coze.local',
  },
  {
    authUserId: 'mock-friend-sage',
    displayName: 'Sage Rivera',
    email: 'sage@coze.local',
  },
];

const discoverableUsers: FriendProfile[] = [
  {
    authUserId: 'mock-user-jules',
    displayName: 'Jules Martin',
    email: 'jules@coze.local',
  },
  {
    authUserId: 'mock-user-rina',
    displayName: 'Rina Kim',
    email: 'rina@coze.local',
  },
  {
    authUserId: 'mock-user-theo',
    displayName: 'Theo Williams',
    email: 'theo@coze.local',
  },
];

type MockLocationVisit = {
  authHangoutId: string;
  authUserId: string;
  location: string;
  visitedAt: string;
  orderDescription?: string;
  orderRating?: number;
  notes?: string;
  attendanceConfirmed?: boolean;
};

type MockStandaloneOrder = {
  entryId: string;
  authUserId: string;
  location: string;
  visitedAt: string;
  orderDescription: string;
  orderRating?: number;
  notes?: string;
};

const mockVisitJournal: Record<
  string,
  Pick<MockLocationVisit, 'notes' | 'orderDescription' | 'orderRating'>
> = {
  'mock-coffee-november': {
    orderDescription: 'Iced oat latte + blueberry scone',
    orderRating: 4,
    notes: 'The scone was great, but ask for less ice in the latte next time.',
  },
  'mock-coffee-october': {
    orderDescription: 'Hot vanilla latte + almond croissant',
    orderRating: 5,
    notes: 'Perfect study spot before noon. The croissant is worth ordering again.',
  },
  'mock-coffee-august': {
    orderDescription: 'Cold brew',
    orderRating: 3,
    notes: 'A little bitter on its own. Try it with oat milk next time.',
  },
};

export function configureMockApi(api: AxiosInstance) {
  api.interceptors.request.use((config) => {
    config.adapter = async () => handleMockRequest(config);
    return config;
  });
}

async function handleMockRequest(config: InternalAxiosRequestConfig) {
  const method = config.method?.toUpperCase() ?? 'GET';
  const path = (config.url ?? '').split('?')[0];
  const now = new Date().toISOString();

  if (method === 'GET' && path === '/api/auth/status') {
    const response: AuthStatusResponse = authenticated
      ? {
          authenticated: true,
          authUserId: MOCK_USER_ID,
          avatarUrl: null,
          displayName: 'Mock User',
          email: 'mock@coze.local',
        }
      : {
          authenticated: false,
          authUserId: null,
          avatarUrl: null,
          displayName: null,
          email: null,
        };
    return mockResponse(config, 200, response);
  }

  if (method === 'POST' && path === '/api/j_security_check') {
    authenticated = true;
    return mockResponse(config, 204, null);
  }

  if (method === 'POST' && path === '/api/auth/logout') {
    authenticated = false;
    return mockResponse(config, 204, null);
  }

  if (method === 'POST' && path === '/api/users/register') {
    const body = requestBody<UserProfileRequest>(config);
    if (users.some((user) => user.email.toLowerCase() === body.email.trim().toLowerCase())) {
      return mockResponse(config, 409, { message: 'Email is already registered' });
    }
    const user: UserProfileResponse = {
      avatarUrl: body.avatarUrl,
      bio: body.bio,
      createdAt: now,
      displayName: body.displayName,
      email: body.email,
      id: `mock-profile-${users.length + 1}`,
      role: 'USER',
      updatedAt: now,
    };
    users = [...users, user];
    return mockResponse(config, 201, user);
  }

  if (method === 'GET' && path === '/api/users/me') {
    const user: UserProfileResponse = {
      avatarUrl: undefined,
      bio: 'Always down for coffee, a long walk, or trying somewhere new.',
      createdAt: now,
      displayName: 'Mock User',
      email: 'mock@coze.local',
      id: MOCK_USER_ID,
      role: 'USER',
      updatedAt: now,
    };
    return mockResponse(config, 200, user);
  }

  if (method === 'GET' && path === '/api/users/friends') {
    return mockResponse(config, 200, friends);
  }

  if (method === 'GET' && path === '/api/users/search') {
    const query = String(config.params?.q ?? '')
      .trim()
      .toLowerCase();
    const friendIds = new Set(friends.map((friend) => friend.authUserId));
    const results = discoverableUsers.filter(
      (user) =>
        !friendIds.has(user.authUserId) &&
        (user.displayName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)),
    );
    return mockResponse(config, 200, results);
  }

  const addFriendMatch = path.match(/^\/api\/users\/friends\/([^/]+)$/);
  if (method === 'POST' && addFriendMatch) {
    const friendId = decodeURIComponent(addFriendMatch[1]);
    const friend = discoverableUsers.find((user) => user.authUserId === friendId);
    if (!friend) return mockResponse(config, 404, { message: 'User not found' });
    if (!friends.some((current) => current.authUserId === friendId)) {
      friends = [...friends, friend];
    }
    return mockResponse(config, 204, null);
  }

  if (method === 'POST' && path === '/api/locations/visits/sync') {
    const visitsBeforeSync = locationVisits.length;
    const completedHangouts = hangouts.filter(
      (hangout) => Date.parse(hangout.endTime) <= Date.now() && hangout.location.trim(),
    );
    for (const hangout of completedHangouts) {
      for (const authUserId of new Set(hangout.participantAuthUserIds)) {
        const exists = locationVisits.some(
          (visit) =>
            visit.authUserId === authUserId && visit.authHangoutId === hangout.authHangoutId,
        );
        if (!exists) {
          const journal =
            authUserId === MOCK_USER_ID ? (mockVisitJournal[hangout.authHangoutId] ?? {}) : {};
          locationVisits = [
            ...locationVisits,
            {
              authHangoutId: hangout.authHangoutId,
              authUserId,
              location: hangout.location.trim(),
              orderDescription: journal.orderDescription ?? 'No order noted',
              visitedAt: hangout.endTime,
              notes: journal.notes,
              orderRating: journal.orderRating,
            },
          ];
        }
      }
    }
    return mockResponse(config, 200, {
      completedHangoutsProcessed: completedHangouts.length,
      visitsRecorded: locationVisits.length - visitsBeforeSync,
    });
  }

  const userVisitsMatch = path.match(/^\/api\/locations\/visits\/users\/([^/]+)$/);
  if (method === 'GET' && userVisitsMatch) {
    const authUserId = decodeURIComponent(userVisitsMatch[1]);
    const visits = locationVisits.filter(
      (visit) => visit.authUserId === authUserId && visit.attendanceConfirmed !== false,
    );
    return mockResponse(config, 200, summarizeLocationVisits(visits));
  }

  const visitHistoryMatch = path.match(/^\/api\/locations\/visits\/users\/([^/]+)\/history$/);
  if (method === 'GET' && visitHistoryMatch) {
    const authUserId = decodeURIComponent(visitHistoryMatch[1]);
    const locationKey = normalizeLocation(String(config.params?.location ?? ''));
    const visitEntries: LocationVisitDetail[] = locationVisits
      .filter(
        (visit) =>
          visit.authUserId === authUserId &&
          normalizeLocation(visit.location) === locationKey &&
          visit.attendanceConfirmed !== false,
      )
      .map((visit) => {
        const hangout = hangouts.find(
          (candidate) => candidate.authHangoutId === visit.authHangoutId,
        );
        return {
          ...visit,
          entryId: visit.authHangoutId,
          companionAuthUserIds:
            hangout?.participantAuthUserIds.filter(
              (participantId) => participantId !== authUserId,
            ) ?? [],
          attendanceConfirmed: visit.attendanceConfirmed ?? null,
          standaloneOrder: false,
        };
      });
    const standaloneEntries: LocationVisitDetail[] = standaloneOrders
      .filter(
        (order) =>
          order.authUserId === authUserId && normalizeLocation(order.location) === locationKey,
      )
      .map((order) => ({
        ...order,
        attendanceConfirmed: true,
        authHangoutId: null,
        companionAuthUserIds: [],
        standaloneOrder: true,
      }));
    const history = [...visitEntries, ...standaloneEntries].sort(
      (left, right) => Date.parse(right.visitedAt) - Date.parse(left.visitedAt),
    );
    return mockResponse(config, 200, history);
  }

  const pendingVisitsMatch = path.match(/^\/api\/locations\/visits\/users\/([^/]+)\/pending$/);
  if (method === 'GET' && pendingVisitsMatch) {
    const authUserId = decodeURIComponent(pendingVisitsMatch[1]);
    const pending = locationVisits
      .filter(
        (visit) =>
          visit.authUserId === authUserId &&
          visit.attendanceConfirmed !== false &&
          (visit.attendanceConfirmed === undefined ||
            !visit.orderDescription?.trim() ||
            visit.orderDescription.trim().toLowerCase() === 'no order noted'),
      )
      .map((visit) => {
        const hangout = hangouts.find(
          (candidate) => candidate.authHangoutId === visit.authHangoutId,
        );
        return {
          authHangoutId: visit.authHangoutId,
          hangoutName: hangout?.hangoutName,
          location: visit.location,
          visitedAt: visit.visitedAt,
          attendanceConfirmed: visit.attendanceConfirmed ?? null,
        };
      })
      .sort((left, right) => Date.parse(right.visitedAt) - Date.parse(left.visitedAt));
    return mockResponse(config, 200, pending);
  }

  const attendanceMatch = path.match(
    /^\/api\/locations\/visits\/users\/([^/]+)\/hangouts\/([^/]+)\/attendance$/,
  );
  if (method === 'PUT' && attendanceMatch) {
    const authUserId = decodeURIComponent(attendanceMatch[1]);
    const authHangoutId = decodeURIComponent(attendanceMatch[2]);
    const body = requestBody<{ attended: boolean }>(config);
    const visit = locationVisits.find(
      (candidate) =>
        candidate.authUserId === authUserId && candidate.authHangoutId === authHangoutId,
    );
    if (!visit) return mockResponse(config, 404, { message: 'Visit not found' });
    visit.attendanceConfirmed = body.attended;
    return mockResponse(config, 204, null);
  }

  const journalMatch = path.match(
    /^\/api\/locations\/visits\/users\/([^/]+)\/hangouts\/([^/]+)\/journal$/,
  );
  if (method === 'PUT' && journalMatch) {
    const authUserId = decodeURIComponent(journalMatch[1]);
    const authHangoutId = decodeURIComponent(journalMatch[2]);
    const body = requestBody<{
      notes?: string;
      orderDescription?: string;
      orderRating?: number;
    }>(config);
    const visit = locationVisits.find(
      (candidate) =>
        candidate.authUserId === authUserId && candidate.authHangoutId === authHangoutId,
    );
    if (!visit) return mockResponse(config, 404, { message: 'Visit not found' });
    visit.orderDescription = body.orderDescription?.trim() || undefined;
    visit.orderRating = body.orderRating;
    visit.notes = body.notes?.trim() || undefined;
    const hangout = hangouts.find((candidate) => candidate.authHangoutId === authHangoutId);
    return mockResponse(config, 200, {
      ...visit,
      entryId: visit.authHangoutId,
      companionAuthUserIds:
        hangout?.participantAuthUserIds.filter((participantId) => participantId !== authUserId) ??
        [],
      attendanceConfirmed: visit.attendanceConfirmed ?? null,
      standaloneOrder: false,
    });
  }

  const deleteVisitMatch = path.match(
    /^\/api\/locations\/visits\/users\/([^/]+)\/hangouts\/([^/]+)$/,
  );
  if (method === 'DELETE' && deleteVisitMatch) {
    const authUserId = decodeURIComponent(deleteVisitMatch[1]);
    const authHangoutId = decodeURIComponent(deleteVisitMatch[2]);
    const visit = locationVisits.find(
      (candidate) =>
        candidate.authUserId === authUserId && candidate.authHangoutId === authHangoutId,
    );
    if (!visit) return mockResponse(config, 404, { message: 'Visit not found' });
    // Retain a tombstone so a later completed-hangout sync does not recreate it.
    visit.attendanceConfirmed = false;
    return mockResponse(config, 204, null);
  }

  const standaloneOrderMatch = path.match(/^\/api\/locations\/visits\/users\/([^/]+)\/orders$/);
  if (method === 'POST' && standaloneOrderMatch) {
    const authUserId = decodeURIComponent(standaloneOrderMatch[1]);
    const body = requestBody<{
      location: string;
      notes?: string;
      orderDescription: string;
      orderRating?: number;
    }>(config);
    const order: MockStandaloneOrder = {
      authUserId,
      entryId: `mock-standalone-order-${standaloneOrders.length + 1}`,
      location: body.location.trim(),
      notes: body.notes?.trim() || undefined,
      orderDescription: body.orderDescription.trim(),
      orderRating: body.orderRating,
      visitedAt: now,
    };
    standaloneOrders = [order, ...standaloneOrders];
    return mockResponse(config, 201, {
      ...order,
      attendanceConfirmed: true,
      authHangoutId: null,
      companionAuthUserIds: [],
      standaloneOrder: true,
    });
  }

  const updateStandaloneOrderMatch = path.match(
    /^\/api\/locations\/visits\/users\/([^/]+)\/orders\/([^/]+)$/,
  );
  if (method === 'PUT' && updateStandaloneOrderMatch) {
    const authUserId = decodeURIComponent(updateStandaloneOrderMatch[1]);
    const orderId = decodeURIComponent(updateStandaloneOrderMatch[2]);
    const body = requestBody<{
      notes?: string;
      orderDescription?: string;
      orderRating?: number;
    }>(config);
    const order = standaloneOrders.find(
      (candidate) => candidate.authUserId === authUserId && candidate.entryId === orderId,
    );
    if (!order) return mockResponse(config, 404, { message: 'Order not found' });
    order.orderDescription = body.orderDescription?.trim() || order.orderDescription;
    order.orderRating = body.orderRating;
    order.notes = body.notes?.trim() || undefined;
    return mockResponse(config, 200, {
      ...order,
      attendanceConfirmed: true,
      authHangoutId: null,
      companionAuthUserIds: [],
      standaloneOrder: true,
    });
  }

  if (method === 'DELETE' && updateStandaloneOrderMatch) {
    const authUserId = decodeURIComponent(updateStandaloneOrderMatch[1]);
    const orderId = decodeURIComponent(updateStandaloneOrderMatch[2]);
    const orderIndex = standaloneOrders.findIndex(
      (candidate) => candidate.authUserId === authUserId && candidate.entryId === orderId,
    );
    if (orderIndex < 0) return mockResponse(config, 404, { message: 'Order not found' });
    standaloneOrders = standaloneOrders.filter((_, index) => index !== orderIndex);
    return mockResponse(config, 204, null);
  }

  if (method === 'POST' && path === '/api/locations/visits/friends') {
    const body = requestBody<{ location: string; friendAuthUserIds: string[] }>(config);
    const locationKey = normalizeLocation(body.location);
    const friendIds = new Set(body.friendAuthUserIds);
    const matchingVisits = locationVisits.filter(
      (visit) =>
        friendIds.has(visit.authUserId) &&
        normalizeLocation(visit.location) === locationKey &&
        visit.attendanceConfirmed !== false,
    );
    const summaries = new Map<string, { visitCount: number; lastVisitedAt: string }>();
    for (const visit of matchingVisits) {
      const current = summaries.get(visit.authUserId);
      summaries.set(visit.authUserId, {
        visitCount: (current?.visitCount ?? 0) + 1,
        lastVisitedAt:
          !current || Date.parse(visit.visitedAt) > Date.parse(current.lastVisitedAt)
            ? visit.visitedAt
            : current.lastVisitedAt,
      });
    }
    return mockResponse(
      config,
      200,
      Array.from(summaries, ([authUserId, summary]) => ({ authUserId, ...summary })),
    );
  }

  if (method === 'DELETE' && path === '/api/users/delete') {
    authenticated = false;
    users = users.filter((user) => user.id !== MOCK_USER_ID);
    return mockResponse(config, 204, null);
  }

  const userHangoutsMatch = path.match(/^\/api\/hangouts\/user\/([^/]+)$/);
  if (method === 'GET' && userHangoutsMatch) {
    const userId = decodeURIComponent(userHangoutsMatch[1]);
    const result = hangouts.filter(
      (hangout) =>
        hangout.participantAuthUserIds.includes(userId) ||
        hangout.invitedAuthUserIds.includes(userId) ||
        hangout.isOpen,
    );
    return mockResponse(config, 200, result);
  }

  const createHangoutMatch = path.match(/^\/api\/hangouts\/([^/]+)\/create$/);
  if (method === 'POST' && createHangoutMatch) {
    const body = requestBody<HangoutRequest>(config);
    const hangout: Hangout = {
      ...body,
      authHangoutId: decodeURIComponent(createHangoutMatch[1]),
      createdAt: now,
      id: `mock-hangout-${hangouts.length + 1}`,
      updatedAt: now,
    };
    hangouts = [...hangouts, hangout];
    return mockResponse(config, 201, hangout);
  }

  const updateHangoutMatch = path.match(/^\/api\/hangouts\/([^/]+)\/update$/);
  if (method === 'PUT' && updateHangoutMatch) {
    const authHangoutId = decodeURIComponent(updateHangoutMatch[1]);
    const body = requestBody<HangoutRequest>(config);
    const index = hangouts.findIndex((hangout) => hangout.authHangoutId === authHangoutId);
    if (index < 0) return mockResponse(config, 404, { message: 'Hangout not found' });

    const updated: Hangout = { ...hangouts[index], ...body, updatedAt: now };
    hangouts = hangouts.map((hangout, currentIndex) =>
      currentIndex === index ? updated : hangout,
    );
    return mockResponse(config, 200, updated);
  }

  const deleteHangoutMatch = path.match(/^\/api\/hangouts\/([^/]+)\/delete$/);
  if (method === 'DELETE' && deleteHangoutMatch) {
    const authHangoutId = decodeURIComponent(deleteHangoutMatch[1]);
    const exists = hangouts.some((hangout) => hangout.authHangoutId === authHangoutId);
    if (!exists) return mockResponse(config, 404, { message: 'Hangout not found' });
    hangouts = hangouts.filter((hangout) => hangout.authHangoutId !== authHangoutId);
    return mockResponse(config, 204, null);
  }

  const inviteMatch = path.match(/^\/api\/hangouts\/([^/]+)\/invitations\/([^/]+)$/);
  if (method === 'POST' && inviteMatch) {
    return updateMembership(config, inviteMatch[1], inviteMatch[2], 'invite', now);
  }

  const joinMatch = path.match(/^\/api\/hangouts\/([^/]+)\/join\/([^/]+)$/);
  if (method === 'POST' && joinMatch) {
    return updateMembership(config, joinMatch[1], joinMatch[2], 'join', now);
  }

  return mockResponse(config, 404, { message: `No mock route for ${method} ${path}` });
}

function requestBody<T>(config: InternalAxiosRequestConfig): T {
  return (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) as T;
}

function summarizeLocationVisits(visits: MockLocationVisit[]) {
  const summaries = new Map<
    string,
    { location: string; visitCount: number; lastVisitedAt: string }
  >();
  for (const visit of visits) {
    const key = normalizeLocation(visit.location);
    const current = summaries.get(key);
    summaries.set(key, {
      location: visit.location,
      visitCount: (current?.visitCount ?? 0) + 1,
      lastVisitedAt:
        !current || Date.parse(visit.visitedAt) > Date.parse(current.lastVisitedAt)
          ? visit.visitedAt
          : current.lastVisitedAt,
    });
  }
  return Array.from(summaries.values());
}

function normalizeLocation(location: string) {
  return location.trim().replace(/\s+/g, ' ').toLowerCase();
}

function mockResponse<T>(config: InternalAxiosRequestConfig, status: number, data: T) {
  const response = {
    config,
    data,
    headers: new AxiosHeaders(),
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
  };

  if (status >= 400) {
    return Promise.reject(
      new AxiosError(
        `Mock request failed with status ${status}`,
        'ERR_BAD_REQUEST',
        config,
        undefined,
        response,
      ),
    );
  }
  return Promise.resolve(response);
}

function createSeedHangouts(): Hangout[] {
  const start = futureDate(1, 15);
  const end = futureDate(1, 17);
  const createdAt = new Date().toISOString();

  return [
    {
      authHangoutId: 'mock-seeded-hangout',
      createdAt,
      description: 'A seeded hangout from the in-memory development API.',
      endTime: end.toISOString(),
      hangoutName: 'coffee & catch up',
      id: 'mock-hangout-1',
      isOpen: true,
      location: 'Local Good Coffee Co.',
      participantAuthUserIds: [MOCK_USER_ID, 'mock-friend-ava', 'mock-friend-miles'],
      invitedAuthUserIds: [],
      startTime: start.toISOString(),
      updatedAt: createdAt,
    },
    createCompletedCoffeeHangout(
      'mock-coffee-november',
      pastDate(4, 15),
      [MOCK_USER_ID, 'mock-friend-ava', 'mock-friend-miles'],
      createdAt,
    ),
    createCompletedCoffeeHangout(
      'mock-coffee-october',
      pastDate(34, 11),
      [MOCK_USER_ID, 'mock-friend-ava'],
      createdAt,
    ),
    createCompletedCoffeeHangout('mock-coffee-august', pastDate(79, 9), [MOCK_USER_ID], createdAt),
  ];
}

function createCompletedCoffeeHangout(
  authHangoutId: string,
  startTime: Date,
  participantAuthUserIds: string[],
  createdAt: string,
): Hangout {
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
  return {
    authHangoutId,
    createdAt,
    description: 'Coffee and time to catch up.',
    endTime: endTime.toISOString(),
    hangoutName: 'coffee & catch up',
    id: `id-${authHangoutId}`,
    invitedAuthUserIds: [],
    isOpen: false,
    location: 'Local Good Coffee Co.',
    participantAuthUserIds,
    startTime: startTime.toISOString(),
    updatedAt: createdAt,
  };
}

function updateMembership(
  config: InternalAxiosRequestConfig,
  encodedHangoutId: string,
  encodedUserId: string,
  action: 'invite' | 'join',
  now: string,
) {
  const authHangoutId = decodeURIComponent(encodedHangoutId);
  const authUserId = decodeURIComponent(encodedUserId);
  const index = hangouts.findIndex((hangout) => hangout.authHangoutId === authHangoutId);
  if (index < 0) return mockResponse(config, 404, { message: 'Hangout not found' });

  const current = hangouts[index];
  if (action === 'join' && !current.isOpen && !current.invitedAuthUserIds.includes(authUserId)) {
    return mockResponse(config, 403, { message: 'Invitation required' });
  }

  const updated: Hangout = {
    ...current,
    invitedAuthUserIds:
      action === 'invite'
        ? Array.from(new Set([...current.invitedAuthUserIds, authUserId]))
        : current.invitedAuthUserIds.filter((id) => id !== authUserId),
    participantAuthUserIds:
      action === 'join'
        ? Array.from(new Set([...current.participantAuthUserIds, authUserId]))
        : current.participantAuthUserIds,
    updatedAt: now,
  };
  hangouts = hangouts.map((hangout, currentIndex) => (currentIndex === index ? updated : hangout));
  return mockResponse(config, 200, updated);
}

function futureDate(daysAhead: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function pastDate(daysAgo: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date;
}
