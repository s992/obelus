import { Outlet, useLinkProps, useLocation } from '@tanstack/react-router';
import { Tab, TabList, TabPanels, Tabs } from 'react-aria-components';
import { FormattedMessage } from 'react-intl';

import { tab, tabContainer, tabContent, tabList } from './auth.css';

export function Auth() {
  const { href: loginHref } = useLinkProps({ to: '/auth/login' });
  const { href: registerHref } = useLinkProps({ to: '/auth/register' });
  const location = useLocation({ select: (loc) => loc.pathname });

  return (
    <div className={tabContainer}>
      <Tabs selectedKey={location}>
        <TabList className={tabList}>
          <Tab id={loginHref} href={loginHref} className={tab}>
            <FormattedMessage defaultMessage="sign in" />
          </Tab>
          <Tab id={registerHref} href={registerHref} className={tab}>
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
