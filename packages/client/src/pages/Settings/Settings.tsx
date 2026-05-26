import { useQuery } from '@tanstack/react-query';
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

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!user) {
    return <NotFound />;
  }

  return (
    <Tabs>
      <TabList>
        <Tab id="userSettings">
          <FormattedMessage defaultMessage="settings" />
        </Tab>
        <Tab id="imports">
          <FormattedMessage defaultMessage="imports" />
        </Tab>
        {user.role === 'admin' && (
          <>
            <Tab id="users">
              <FormattedMessage defaultMessage="users" />
            </Tab>
            <Tab id="config">
              <FormattedMessage defaultMessage="obelus config" />
            </Tab>
          </>
        )}
      </TabList>
      <TabPanels>
        <TabPanel id="userSettings" className={tabPanel}>
          <UserSettings />
        </TabPanel>
        <TabPanel id="imports" className={tabPanel}>
          <Imports />
        </TabPanel>
        <TabPanel id="users" className={tabPanel}>
          <Users />
        </TabPanel>
        <TabPanel id="config" className={tabPanel}>
          <ObelusConfig />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
