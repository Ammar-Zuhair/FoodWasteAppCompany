import { createContext, useContext, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const applyTheme = (currentTheme) => {
    console.log('Applying theme:', currentTheme);

    // Apply class to <html> for Tailwind's darkMode: 'class'
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (Capacitor.isNativePlatform()) {
      try {
        // Overlay is mandatory for env(safe-area-inset-top)
        StatusBar.setOverlaysWebView({ overlay: true });
        StatusBar.show();

        if (currentTheme === 'dark') {
          // Style.Dark means suitable for dark background = LIGHT text
          StatusBar.setStyle({ style: Style.Dark });
          StatusBar.setBackgroundColor({ color: '#0F172A' });
        } else {
          // Style.Light means suitable for light background = DARK text
          StatusBar.setStyle({ style: Style.Light });
          StatusBar.setBackgroundColor({ color: '#FFFFFF' });
        }
      } catch (e) {
        console.warn('StatusBar error:', e);
      }
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('hsa_admin_theme');
    const initialTheme = savedTheme || 'light';

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('hsa_admin_theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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
