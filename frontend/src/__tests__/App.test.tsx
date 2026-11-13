import React from 'react';
import { render } from '@testing-library/react-native';
import { expect, jest, test } from '@jest/globals';

import App from '../App';

jest.mock('../hooks/useAppFonts', () => ({
  useAppFonts: () => [true, null],
}));
jest.mock('../context/AppContext', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../navigation/RootNavigator', () => ({
  RootNavigator: () => null,
}));

test('renders without crashing', () => {
  const { getByTestId } = render(<App />);
  expect(getByTestId('app-root')).toBeTruthy();
});
