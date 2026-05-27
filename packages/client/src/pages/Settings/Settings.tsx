import { useQuery } from '@tanstack/react-query';
import { useLinkProps, useLocation } from '@tanstack/react-router';
import { FormattedMessage } from 'react-intl';

import { useTRPC } from '@/client';
import { FullPageSpinner } from '@/components/FullPageSpinner';
import { NotFound } from '@/components/NotFound';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@/components/Tabs';

import { Imports } from './Imports';
import { ObelusConfig } from './ObelusConfig';
import { tabPanel } from './settings.css';
import { Users } from './Users';
import { UserSettings } from './UserSettings';

export function Settings() {
  const trpc = useTRPC();
  const { data: user, isLoading } = useQuery(trpc.user.me.queryOptions());
  const { href: settingsHref } = useLinkProps({ to: '/settings' });
  const { href: importsHref } = useLinkProps({ to: '/settings/imports' });
  const { href: usersHref } = useLinkProps({ to: '/settings/users' });
  const { href: configHref } = useLinkProps({ to: '/settings/config' });
  const location = useLocation({ select: (loc) => loc.pathname });

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!user) {
    return <NotFound />;
  }

  return (
    <Tabs selectedKey={location}>
      <TabList>
        <Tab id={settingsHref} href={settingsHref}>
          <FormattedMessage defaultMessage="settings" />
        </Tab>
        <Tab id={importsHref} href={importsHref}>
          <FormattedMessage defaultMessage="imports" />
        </Tab>
        {user.role === 'admin' && (
          <>
            <Tab id={usersHref} href={usersHref}>
              <FormattedMessage defaultMessage="users" />
            </Tab>
            <Tab id={configHref} href={configHref}>
              <FormattedMessage defaultMessage="obelus config" />
            </Tab>
          </>
        )}
      </TabList>
      <TabPanels>
        <TabPanel id={settingsHref} className={tabPanel}>
          <UserSettings />
        </TabPanel>
        <TabPanel id={importsHref} className={tabPanel}>
          <Imports />
        </TabPanel>
        <TabPanel id={usersHref} className={tabPanel}>
          <Users />
        </TabPanel>
        <TabPanel id={configHref} className={tabPanel}>
          <ObelusConfig />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
