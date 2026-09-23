import React, { createContext, useState, useEffect, useContext } from 'react';

export const THEMES = [
  {
    id: 'midnight',
    name: 'Midnight Gold',
    tag: 'Dark',
    description: 'Deep navy & warm gold',
    preview: {
      bg: '#0a0f1d',
      surface: '#151f32',
      accent: '#f59e0b',
      border: '#334155',
      gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
    },
  },
  {
    id: 'light',
    name: 'Light Classic',
    tag: 'Light',
    description: 'Crisp white & gold accent',
    preview: {
      bg: '#f8fafc',
      surface: '#ffffff',
      accent: '#f59e0b',
      border: '#e2e8f0',
      gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
    },
  },
  {
    id: 'aurora',
    name: 'Aurora',
    tag: 'Vibrant',
    description: 'Cosmic purple & cyan-teal',
    preview: {
      bg: '#09071a',
      surface: '#1e143c',
      accent: '#06b6d4',
      border: '#a78bfa',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
    },
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    tag: 'Warm',
    description: 'Delicate cream & coral orange',
    preview: {
      bg: '#fffbf5',
      surface: '#ffffff',
      accent: '#f97316',
      border: '#fed7aa',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
    },
  },
];

export const ThemeContext = createContext();

const VALID_THEMES = ['midnight', 'light', 'aurora', 'sunrise'];

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem('laundry_theme');
      if (stored && VALID_THEMES.includes(stored)) {
        return stored;
      }
    } catch (e) {
      console.error('Failed to read theme from localStorage', e);
    }
    return 'midnight';
  });

  // Keep document dataset in sync with theme state
  useEffect(() => {
    try {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('laundry_theme', theme);
    } catch (e) {
      console.error('Failed to save theme to localStorage', e);
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    if (VALID_THEMES.includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  const currentThemeData = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        currentTheme: currentThemeData,
        themes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
