import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { expect, jest, test } from '@jest/globals';

import LoginForm from '../../components/forms/LoginForm';

// mock auth so test doesnt have to use real auth status
jest.mock('../../hooks/useAuth', () => ({
  useAuthHook: () => ({
    isLoggedIn: false,
    isLoading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    refreshAuthStatus: jest.fn(),
  }),
}));

test('renders without crashing', async () => {
  const { getByTestId } = render(<LoginForm />);
  await waitFor(() => expect(getByTestId('login-form')).toBeTruthy());
});
