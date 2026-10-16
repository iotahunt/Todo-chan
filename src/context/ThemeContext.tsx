import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  themeColor: string;
  isDarkMode: boolean;
  isNeonMode: boolean;
  setThemeColor: (color: string) => void;
  setIsDarkMode: (dark: boolean) => void;
  setIsNeonMode: (neon: boolean) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeColor, setThemeColorState] = useState<string>(() => {
    return localStorage.getItem('todochan_theme_color') || '#ff69b4';
  });

  const [isDarkMode, setIsDarkModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('todochan_dark_mode');
    return saved !== null ? saved === 'true' : true;
  });

  const [isNeonMode, setIsNeonModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('todochan_neon_mode');
    return saved !== null ? saved === 'true' : true;
  });

  const setThemeColor = (color: string) => {
    setThemeColorState(color);
    localStorage.setItem('todochan_theme_color', color);
  };

  const setIsDarkMode = (dark: boolean) => {
    setIsDarkModeState(dark);
    localStorage.setItem('todochan_dark_mode', String(dark));
  };

  const setIsNeonMode = (neon: boolean) => {
    setIsNeonModeState(neon);
    localStorage.setItem('todochan_neon_mode', String(neon));
  };

  const resetTheme = () => {
    setThemeColor('#ff69b4');
    setIsDarkMode(true);
    setIsNeonMode(true);
  };

  useEffect(() => {
    const root = document.documentElement;
    const rgb = hexToRgb(themeColor) || { r: 255, g: 105, b: 180 };

    root.style.setProperty('--accent-color', themeColor);
    root.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);

    if (isNeonMode) {
      root.style.setProperty(
        '--neon-glow',
        `0 0 14px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.55), 0 0 28px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`
      );
      root.style.setProperty(
        '--neon-border',
        `1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.65)`
      );
      root.style.setProperty(
        '--ambient-glow',
        `radial-gradient(circle at 50% 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) 0%, transparent 60%)`
      );
    } else {
      root.style.setProperty('--neon-glow', 'none');
      root.style.setProperty('--neon-border', `1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
      root.style.setProperty('--ambient-glow', 'none');
    }

    if (isDarkMode) {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#020617';
      document.body.style.color = '#f8fafc';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#FAF7F2';
      document.body.style.color = '#1C1917';
    }
  }, [themeColor, isDarkMode, isNeonMode]);

  return (
    <ThemeContext.Provider
      value={{
        themeColor,
        isDarkMode,
        isNeonMode,
        setThemeColor,
        setIsDarkMode,
        setIsNeonMode,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
