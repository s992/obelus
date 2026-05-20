import { createContext, type ReactNode, useContext, useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import type { Theme } from '../components/ThemeToggle';
import { darkTheme, lightTheme } from '../style';

type ThemeContext = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ctx = createContext<ThemeContext>({ theme: null!, setTheme: null! });

export function useThemeContext() {
  return useContext(ctx);
}

type Props = {
  children: ReactNode;
};

export function ThemeContextProvider({ children }: Props) {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');

  useEffect(() => {
    const themeToAdd = theme === 'dark' ? darkTheme : lightTheme;
    document.body.classList.add(themeToAdd);

    return () => document.body.classList.remove(themeToAdd);
  }, [theme]);

  return <ctx.Provider value={{ theme, setTheme }}>{children}</ctx.Provider>;
}
