import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { COLORS } from '../constants';

export type AppColors = typeof COLORS;

// Theme consumers use semantic color names, so switching themes never changes
// component layout or requires individual screens to know which mode is active.
const LIGHT_COLORS: AppColors = {
  ...COLORS,
  // Main screens used this paper color before dark mode was introduced.
  background: '#fbf5ef',
};

const DARK_COLORS: AppColors = {
  primary: '#B86E6E',
  background: '#1E1B19',
  dateBadgeText: '#1E1B19',
  surface: '#292522',
  text: '#E5DCD4',
  muted: '#A6968D',
  mutedBorder: 'rgba(112, 143, 136, 0.28)',
  brown: '#A6968D',
  black: '#F1E8E1',
  placeholder: '#806F68',
  yellow: '#B3925D',
  coral: '#BD7774',
  accent: '#BD7774',
  teal: '#708F88',
  tealSoft: '#34413E',
  tealDark: '#93AAA4',
};

type ThemeContextValue = {
  colors: AppColors;
  isDarkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setDarkMode] = useState(false);
  const value = useMemo(
    () => ({ colors: isDarkMode ? DARK_COLORS : LIGHT_COLORS, isDarkMode, setDarkMode }),
    [isDarkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}
