import React from 'react';
import { render } from '@testing-library/react-native';
import { expect, test } from '@jest/globals';

import App from '../App';

test('renders without crashing', () => {
  const { getByTestId } = render(<App />);
  expect(getByTestId('app-root')).toBeTruthy();
});
