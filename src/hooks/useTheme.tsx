import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode =
  | 'automatic'
  | 'poupagaio'
  | 'blue-light'
  | 'ocean'
  | 'nature';

export type ActiveTheme =
  | 'poupagaio'
  | 'blue-light'
  | 'ocean'
  | 'nature';

interface ThemeContextType {
  themeMode: ThemeMode;
  activeTheme: ActiveTheme;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  // Backward compatibility
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'poupagaio_theme_mode';

const VALID_THEMES: ThemeMode[] = [
  'automatic',
  'poupagaio',
  'blue-light',
  'ocean',
  'nature',
];

function resolveSystemTheme(): ActiveTheme {
  return 'poupagaio';
}

function resolveActiveTheme(mode: ThemeMode): ActiveTheme {
  if (mode === 'automatic') {
    return resolveSystemTheme();
  }
  return mode;
}

function isDarkTheme(_theme: ActiveTheme): boolean {
  return false;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (savedMode && VALID_THEMES.includes(savedMode)) {
        return savedMode;
      }
    }
    return 'poupagaio';
  });

  const [activeTheme, setActiveTheme] = useState<ActiveTheme>(() => resolveActiveTheme(themeMode));

  // Handle system preference changes when in 'automatic' mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (themeMode === 'automatic') {
      setActiveTheme(resolveSystemTheme());
    } else {
      setActiveTheme(themeMode);
    }
  }, [themeMode]);

  // Sync document attribute and localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    root.setAttribute('data-theme', activeTheme);
    root.dataset.theme = activeTheme;

    root.classList.remove('dark');

    localStorage.setItem(STORAGE_KEY, themeMode);
    localStorage.setItem('poupagaio_theme', 'light');
  }, [themeMode, activeTheme]);

  const setThemeMode = (newMode: ThemeMode) => {
    setThemeModeState(newMode);
  };

  const isDark = isDarkTheme(activeTheme);
  const legacyTheme = 'light';

  const toggleTheme = () => {
    if (themeMode === 'poupagaio') {
      setThemeModeState('nature');
    } else if (themeMode === 'nature') {
      setThemeModeState('ocean');
    } else if (themeMode === 'ocean') {
      setThemeModeState('blue-light');
    } else {
      setThemeModeState('poupagaio');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        activeTheme,
        isDark,
        setThemeMode,
        theme: legacyTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
