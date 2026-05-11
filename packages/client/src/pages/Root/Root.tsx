import { TanStackDevtools } from '@tanstack/react-devtools';
import { FormDevtoolsPanel } from '@tanstack/react-form-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { Outlet, Link as RouterLink, useNavigate, useRouter } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { Link } from '../../components/Link';
import { SearchModal } from '../../components/SearchModal';
import { type Theme, ThemeToggle } from '../../components/ThemeToggle';
import { useAuthContext } from '../../context';
import { darkTheme, lightTheme } from '../../style';
import { brand, container, headerContainer, navSection, obelusMark, pageWrapper, searchButton } from './root.css';

export function Root() {
  const intl = useIntl();
  const navigate = useNavigate();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthContext();
  const [theme, setTheme] = useState<Theme>('light');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useHotkeys('mod+k', () => setIsSearchOpen((current) => !current), { preventDefault: true, enableOnFormTags: true });

  useEffect(() => {
    const themeToAdd = theme === 'dark' ? darkTheme : lightTheme;
    document.body.classList.add(themeToAdd);

    return () => document.body.classList.remove(themeToAdd);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = router.subscribe('onBeforeNavigate', () => {
      setIsSearchOpen(false);
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className={pageWrapper}>
      <div className={container}>
        <header className={headerContainer}>
          <RouterLink className={brand} to="/">
            <span className={obelusMark}>÷</span>
            <span>Obelus</span>
          </RouterLink>
          <nav className={navSection}>
            {isAuthenticated && (
              <>
                <IconButton
                  className={searchButton}
                  aria-label={intl.formatMessage({ defaultMessage: 'Search' })}
                  onPress={() => setIsSearchOpen(true)}
                >
                  <Search />
                </IconButton>
                <Link to="/">
                  <FormattedMessage defaultMessage="reading" />
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
      {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} />}
    </div>
  );
}
