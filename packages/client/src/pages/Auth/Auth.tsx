import { Outlet, useLinkProps, useLocation } from '@tanstack/react-router';
import { FormattedMessage } from 'react-intl';

import { Tab, TabList, TabPanels, Tabs } from '@/components/Tabs';

import { tabContainer, tabContent } from './auth.css';

export function Auth() {
  const { href: loginHref } = useLinkProps({ to: '/auth/login' });
  const { href: registerHref } = useLinkProps({ to: '/auth/register' });
  const location = useLocation({ select: (loc) => loc.pathname });

  return (
    <div className={tabContainer}>
      <Tabs selectedKey={location}>
        <TabList>
          <Tab id={loginHref} href={loginHref}>
            <FormattedMessage defaultMessage="sign in" />
          </Tab>
          <Tab id={registerHref} href={registerHref}>
            <FormattedMessage defaultMessage="register" />
          </Tab>
        </TabList>
        <TabPanels>
          <div className={tabContent}>
            <Outlet />
          </div>
        </TabPanels>
      </Tabs>
    </div>
  );
}
