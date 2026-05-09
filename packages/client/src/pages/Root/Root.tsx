import { Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import clsx from 'clsx';
import { useState } from 'react';

import { type Theme, ThemeToggle } from '../../components/ThemeToggle';
import { darkTheme, lightTheme } from '../../style';
import { brand, container, headerContainer, obelusMark, pageWrapper } from './root.css';

export function Root() {
  const [theme, setTheme] = useState<Theme>('light');

  return (
    <div
      className={clsx(
        {
          [lightTheme]: theme === 'light',
          [darkTheme]: theme === 'dark',
        },
        pageWrapper,
      )}
    >
      <div className={container}>
        <header className={headerContainer}>
          <div className={brand}>
            <span className={obelusMark}>÷</span>
            <span>Obelus</span>
          </div>
          <nav>
            <ThemeToggle currentTheme={theme} onChange={setTheme} />
          </nav>
        </header>
        <Outlet />
        <TanStackRouterDevtools />
      </div>
    </div>
  );
}
