import { describe, expect, test } from '@jest/globals';

import formatCalendarMonth from '../../utils/formatCalendarMonth';

describe('formatCalendarMonth', () => {
  test('abbreviates month names with six or more characters', () => {
    expect(formatCalendarMonth(new Date(2026, 7, 1))).toBe('aug');
    expect(formatCalendarMonth(new Date(2026, 10, 1))).toBe('nov');
  });

  test('keeps shorter month names fully spelled out', () => {
    expect(formatCalendarMonth(new Date(2026, 2, 1))).toBe('march');
    expect(formatCalendarMonth(new Date(2026, 4, 1))).toBe('may');
  });
});
