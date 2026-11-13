import axios from 'axios';
import { afterAll, describe, expect, jest, test } from '@jest/globals';

const shouldRun = process.env.RUN_BACKEND_INTEGRATION === 'true';
const apiUrl = (process.env.API_URL ?? 'http://localhost:8080')
  .trim()
  .replace(/^['"]|['"];?$/g, '')
  .replace(/;$/, '');
const describeBackend = shouldRun ? describe : describe.skip;

describeBackend('real backend MVP flow', () => {
  jest.setTimeout(20000);

  const client = axios.create({ baseURL: apiUrl, timeout: 5000 });
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `integration-${unique}@coze.local`;
  const friendEmail = `integration-friend-${unique}@coze.local`;
  const password = 'integration-password';
  const authHangoutId = objectId();
  let authUserId: string | undefined;
  let friendAuthUserId: string | undefined;
  let sessionCookie: string | undefined;
  let friendSessionCookie: string | undefined;
  let hangoutCreated = false;

  afterAll(async () => {
    // Cleanup keeps repeated local runs independent. Each request is best-effort
    // so a cleanup problem does not hide the original test failure.
    if (hangoutCreated) {
      await client.delete(`/api/hangouts/${authHangoutId}/delete`).catch(() => undefined);
    }
    if (sessionCookie) {
      await client
        .delete('/api/users/delete', { headers: { Cookie: sessionCookie } })
        .catch(() => undefined);
    }
    if (friendSessionCookie) {
      await client
        .delete('/api/users/delete', { headers: { Cookie: friendSessionCookie } })
        .catch(() => undefined);
    }
  });

  test('gateway and routed services are reachable', async () => {
    const [health, users, hangouts] = await Promise.all([
      client.get('/actuator/health'),
      client.get('/api/users/ping'),
      client.get('/api/hangouts/ping'),
    ]);

    expect(health.data.status).toBe('UP');
    expect(users.data).toBe('user-profile-service is running');
    expect(hangouts.data).toBe('hangouts-service is running');
  });

  test('registers, logs in, adds a friend, and persists a hangout', async () => {
    const registration = await client.post('/api/users/register', {
      avatarUrl: null,
      bio: 'Created by the backend integration test.',
      displayName: 'Integration User',
      email,
      password,
      role: 'USER',
    });
    authUserId = registration.data.id;
    expect(authUserId).toMatch(/^[0-9a-f]{24}$/i);

    const friendRegistration = await client.post('/api/users/register', {
      avatarUrl: null,
      bio: null,
      displayName: 'Integration Friend',
      email: friendEmail,
      password,
      role: 'USER',
    });
    friendAuthUserId = friendRegistration.data.id;
    friendSessionCookie = await loginAndGetCookie(client, friendEmail, password);

    sessionCookie = await loginAndGetCookie(client, email, password);
    expect(sessionCookie).toBeDefined();

    const authStatus = await client.get('/api/auth/status', {
      headers: { Cookie: sessionCookie },
    });
    expect(authStatus.data).toMatchObject({
      authenticated: true,
      authUserId,
      email,
    });

    await client.post(`/api/users/friends/${friendAuthUserId}`, undefined, {
      headers: { Cookie: sessionCookie },
    });
    const friends = await client.get('/api/users/friends', {
      headers: { Cookie: sessionCookie },
    });
    expect(friends.data).toEqual([
      expect.objectContaining({ authUserId: friendAuthUserId, email: friendEmail }),
    ]);
    expect(friends.data[0]).not.toHaveProperty('password');

    const startTime = new Date(Date.now() + 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const created = await client.post(`/api/hangouts/${authHangoutId}/create`, {
      description: 'Exercises the real frontend/backend contract.',
      endTime: endTime.toISOString(),
      hangoutName: 'integration hangout',
      isOpen: true,
      location: 'Integration Test',
      participantAuthUserIds: [authUserId],
      startTime: startTime.toISOString(),
    });
    hangoutCreated = true;
    expect(created.data.authHangoutId).toBe(authHangoutId);

    const calendar = await client.get(`/api/hangouts/user/${authUserId}`);
    expect(calendar.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ authHangoutId })]),
    );
  });
});

function cookieHeader(setCookie: string[] | undefined) {
  return setCookie?.map((value) => value.split(';', 1)[0]).join('; ');
}

async function loginAndGetCookie(
  client: ReturnType<typeof axios.create>,
  email: string,
  password: string,
) {
  const credentials = new URLSearchParams({
    j_password: password,
    j_username: email,
  });
  const login = await client.post('/api/j_security_check', credentials.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return cookieHeader(login.headers['set-cookie']);
}

function objectId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(
    '',
  );
  return `${timestamp}${random}`;
}
