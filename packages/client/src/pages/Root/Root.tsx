import { Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '../../components/Button';
import { darkTheme, lightTheme } from '../../style';
import { brand, container, headerContainer, obelusMark, pageWrapper } from './root.css';

type Theme = 'light' | 'dark';

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
            <span className={obelusMark}>÷</span> <span>Obelus</span>
          </div>
          <nav>
            <Button
              variant="tertiary"
              onPress={() => setTheme((currTheme) => (currTheme === 'light' ? 'dark' : 'light'))}
            >
              {theme} mode
            </Button>
          </nav>
        </header>
        <Outlet />
        <TanStackRouterDevtools />
      </div>
    </div>
  );
}
