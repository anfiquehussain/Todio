import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './routes';
import { useAuth } from './hooks/useAuth';
import { useAppSelector } from './hooks/useRedux';

const App = () => {
  useAuth(); // Initialize auth listener
  const { fontFamily, fontSize } = useAppSelector((state) => state.settings);

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
  }, [fontFamily, fontSize]);

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
