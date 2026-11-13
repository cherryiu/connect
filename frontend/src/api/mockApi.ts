import {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import type { Hangout, HangoutRequest } from './hangoutsApi';
import type { AuthStatusResponse } from './authApi';
import type { FriendProfile, UserProfileRequest, UserProfileResponse } from './usersApi';

const MOCK_USER_ID = 'mock-user-1';
let authenticated = false;
let users: UserProfileResponse[] = [];
let hangouts: Hangout[] = createSeedHangouts();
const friends: FriendProfile[] = [
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
  ];
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
