import axios from 'axios';
import { describe, expect, jest, test } from '@jest/globals';

const shouldRun = process.env.RUN_BACKEND_INTEGRATION === 'true';
const apiUrl = (process.env.API_URL ?? 'http://localhost:8080')
  .trim()
  .replace(/^['"]|['"];?$/g, '')
  .replace(/;$/, '');
const describeBackend = shouldRun ? describe : describe.skip;

describeBackend('backend integration', () => {
  jest.setTimeout(10000);

  test('api gateway health endpoint is reachable', async () => {
    const response = await axios.get(`${apiUrl}/actuator/health`, {
      timeout: 5000,
    });

    expect(response.status).toBe(200);
    expect(response.data.status).toBe('UP');
  });

  test('users service is reachable through the api gateway', async () => {
    const response = await axios.get(`${apiUrl}/api/users/test-user-id/ping`, {
      timeout: 5000,
    });

    expect(response.status).toBe(200);
    expect(response.data).toBe('user-profile-service is running');
  });

  test('hangouts service is reachable through the api gateway', async () => {
    const response = await axios.get(`${apiUrl}/api/hangouts/test-hangout-id/ping`, {
      timeout: 5000,
    });

    expect(response.status).toBe(200);
    expect(response.data).toBe('hangouts-service is running');
  });
});
