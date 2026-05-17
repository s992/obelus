import { TanStackDevtools } from '@tanstack/react-devtools';
import { FormDevtoolsPanel } from '@tanstack/react-form-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { Outlet, Link as RouterLink, useNavigate, useRouter } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import clsx from 'clsx';
import { Menu, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocalStorage, useOnClickOutside } from 'usehooks-ts';

import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { Link } from '../../components/Link';
import { type Theme, ThemeToggle } from '../../components/ThemeToggle';
import { ToastRegion } from '../../components/Toast';
import { useAuthContext } from '../../context';
import { SearchModal } from '../../features/SearchModal';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { darkTheme, lightTheme, mediaQuery } from '../../style';
import {
  brand,
  container,
  headerContainer,
  navSection,
  navSectionOpen,
  navToggle,
  obelusMark,
  pageWrapper,
  searchButton,
} from './root.css';

export function Root() {
  const intl = useIntl();
  const navigate = useNavigate();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthContext();
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const isDesktop = useMediaQuery(mediaQuery.mobileUp);
  const navRef = useRef<HTMLDivElement>(null!);

  useHotkeys('mod+k', () => setIsSearchOpen((current) => !current), { preventDefault: true, enableOnFormTags: true });
  useHotkeys('Esc', () => setIsNavOpen(false));

  useEffect(() => {
    const themeToAdd = theme === 'dark' ? darkTheme : lightTheme;
    document.body.classList.add(themeToAdd);

    return () => document.body.classList.remove(themeToAdd);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = router.subscribe('onBeforeNavigate', () => {
      setIsSearchOpen(false);
      setIsNavOpen(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (isDesktop) {
      setIsNavOpen(false);
    }
  }, [isDesktop]);

  useOnClickOutside(navRef, () => {
    setIsNavOpen(false);
  });

  return (
    <div className={pageWrapper}>
      <div className={container}>
        <header className={headerContainer}>
          <RouterLink className={brand} to="/">
            <span className={obelusMark}>÷</span>
            <span>Obelus</span>
          </RouterLink>
          <nav id="nav-menu" className={clsx(navSection, { [navSectionOpen]: isNavOpen })} ref={navRef}>
            {isAuthenticated && (
              <>
                <IconButton
                  className={searchButton}
                  aria-label={intl.formatMessage({ defaultMessage: 'Search' })}
                  onPress={() => {
                    setIsSearchOpen(true);
                    setIsNavOpen(false);
                  }}
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
          <IconButton
            aria-label={intl.formatMessage({ defaultMessage: 'Toggle navigation' })}
            aria-expanded={isNavOpen}
            aria-controls="nav-menu"
            variant="tertiary"
            className={navToggle}
            onPress={() => setIsNavOpen((current) => !current)}
          >
            <Menu />
          </IconButton>
        </header>
        <Outlet />
        {import.meta.env.MODE !== 'production' && (
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
        )}
      </div>
      {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} />}
      <ToastRegion />
    </div>
  );
}
