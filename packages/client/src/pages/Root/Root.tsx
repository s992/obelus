import { TanStackDevtools } from '@tanstack/react-devtools';
import { FormDevtoolsPanel } from '@tanstack/react-form-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { Outlet, Link as RouterLink, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import clsx from 'clsx';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { Button } from '../../components/Button';
import { Link } from '../../components/Link';
import { type Theme, ThemeToggle } from '../../components/ThemeToggle';
import { useAuthContext } from '../../context';
import { darkTheme, lightTheme } from '../../style';
import { brand, container, headerContainer, navSection, obelusMark, pageWrapper } from './root.css';

export function Root() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthContext();
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
          <RouterLink className={brand} to="/">
            <span className={obelusMark}>÷</span>
            <span>Obelus</span>
          </RouterLink>
          <nav className={navSection}>
            {isAuthenticated && (
              <>
                <Link to="/">
                  <FormattedMessage defaultMessage="record" />
                </Link>
                <Link to="/read">
                  <FormattedMessage defaultMessage="read" />
                </Link>
                <Link to="/planned">
                  <FormattedMessage defaultMessage="planned" />
                </Link>
                <Link to="/settings">
                  <FormattedMessage defaultMessage="settings" />
                </Link>
                <Button
                  variant="underlined"
                  onPress={async () => {
                    await logout();
                    navigate({ to: '/auth/login' });
                  }}
                >
                  <FormattedMessage defaultMessage="log out" />
                </Button>
              </>
            )}
            <ThemeToggle currentTheme={theme} onChange={setTheme} />
          </nav>
        </header>
        <Outlet />
        <TanStackDevtools
          plugins={[
            {
              name: 'Query',
              render: <ReactQueryDevtoolsPanel />,
            },
            {
              name: 'Form',
              render: <FormDevtoolsPanel />,
            },
            {
              name: 'Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      </div>
    </div>
  );
}
