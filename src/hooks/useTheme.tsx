import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'poupagaio' | 'ocean' | 'nature';
export type ActiveTheme = 'poupagaio' | 'ocean' | 'nature';

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

const VALID_THEMES: ThemeMode[] = ['poupagaio', 'ocean', 'nature'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (savedMode && VALID_THEMES.includes(savedMode)) {
        return savedMode;
      }
      
      // Legacy theme migration
      const legacyTheme = localStorage.getItem('poupagaio_theme');
      if (legacyTheme === 'light') return 'poupagaio';
      // Any other theme (like blue-dark, dark, high-contrast, automatic) migrates to 'poupagaio' (Oficial)
    }
    return 'poupagaio';
  });

  const [activeTheme, setActiveTheme] = useState<ActiveTheme>(themeMode);

  useEffect(() => {
    setActiveTheme(themeMode);
  }, [themeMode]);

  // Sync document attribute, dark class, and localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // In our simplified theme system, all three authorized themes (poupagaio, ocean, nature) are light backgrounds.
    // Therefore, we do not add 'dark' class, and data-theme matches the active theme.
    root.setAttribute('data-theme', activeTheme);
    root.dataset.theme = activeTheme;
    root.classList.remove('dark');

    localStorage.setItem(STORAGE_KEY, themeMode);
    localStorage.setItem('poupagaio_theme', 'light');
  }, [themeMode, activeTheme]);

  const setThemeMode = (newMode: ThemeMode) => {
    if (VALID_THEMES.includes(newMode)) {
      setThemeModeState(newMode);
    } else {
      setThemeModeState('poupagaio');
    }
  };

  // Toggle theme switches between poupagaio and ocean
  const toggleTheme = () => {
    setThemeModeState((prev) => (prev === 'poupagaio' ? 'ocean' : 'poupagaio'));
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        activeTheme,
        isDark: false,
        setThemeMode,
        theme: 'light',
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
