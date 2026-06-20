import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './routes';
import { useAuth } from './hooks/useAuth';
import { useAppSelector } from './hooks/useRedux';

const ACCENT_THEMES: Record<string, { primary: string; hover: string; secondary?: string; light?: string }> = {
  'midnight-gold': { primary: '#c2883c', hover: '#d4a45c', light: '#fef08a' },
  'nordic-frost': { primary: '#06b6d4', hover: '#22d3ee', light: '#e0f7fa' },
  'sapphire-blue': { primary: '#3b82f6', hover: '#60a5fa', light: '#dbeafe' },
  'obsidian-emerald': { primary: '#10b981', hover: '#34d399', light: '#d1fae5' },
  'royal-amethyst': { primary: '#8b5cf6', hover: '#a78bfa', light: '#f3e8ff' },
  'crimson-rose': { primary: '#f43f5e', hover: '#fb7185', light: '#ffe4e6' },
  'copper-orange': { primary: '#f97316', hover: '#fb923c', light: '#ffedd5' },
  'arctic-silver': { primary: '#94a3b8', hover: '#cbd5e1', light: '#f1f5f9' },
  'ruby-red': { primary: '#dc2626', hover: '#ef4444', light: '#fee2e2' },
  'catppuccin-mocha': { primary: '#cba6f7', hover: '#d7b8ff', light: '#f5e0dc' },
  'dracula': { primary: '#bd93f9', hover: '#d6acff', light: '#f8f8f2' },
  'solarized': { primary: '#268bd2', hover: '#4aa3df', light: '#eee8d5' },
};

const App = () => {
  useAuth(); // Initialize auth listener
  const { fontFamily, fontSize, theme, accentTheme } = useAppSelector((state) => state.settings);

  useEffect(() => {
    // Apply Font Family
    const fontMapping: Record<string, string> = {
      default: "'Inter', 'Outfit', system-ui, sans-serif",
      inter: "'Inter', sans-serif",
      outfit: "'Outfit', sans-serif",
      roboto: "'Roboto', sans-serif",
      lexend: "'Lexend', sans-serif",
      playfair: "'Playfair Display', serif",
      mono: "monospace"
    };
    
    const fontValue = fontMapping[fontFamily] || fontMapping.default;
    document.documentElement.style.setProperty('--font-sans', fontValue);
    
    // Apply Font Size
    const sizeMapping: Record<string, string> = {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px'
    };
    
    const sizeValue = sizeMapping[fontSize] || sizeMapping.md;
    document.documentElement.style.fontSize = sizeValue;

    // Apply Accent Theme Colors
    const themeColors = ACCENT_THEMES[accentTheme] || ACCENT_THEMES['midnight-gold'];
    document.documentElement.style.setProperty('--color-brand-primary', themeColors.primary);
    document.documentElement.style.setProperty('--color-brand-accent', themeColors.primary);
    document.documentElement.style.setProperty('--color-brand-light', themeColors.light || themeColors.primary);
    // Custom hover variables can also be set or used in CSS
    document.documentElement.style.setProperty('--color-brand-primary-hover', themeColors.hover);

    // Apply Theme Mode (Dark/Light)
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [fontFamily, fontSize, theme, accentTheme]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--text-primary))',
            borderColor: 'hsl(var(--gray-border))',
            borderRadius: '1.25rem',
            fontFamily: 'sans-serif',
          },
        }}
      />
    </>
  );
};

export default App;
