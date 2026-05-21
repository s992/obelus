import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'react-aria-components';
import { FormattedMessage } from 'react-intl';

import { useTRPC } from '../../client';
import { AppHeader } from '../../components/AppHeader';
import { FullPageSpinner } from '../../components/FullPageSpinner';
import { NotFound } from '../../components/NotFound';
import { typography } from '../../style';
import { PublicBookList } from './PublicBookList';
import {
  bio,
  footer,
  handle,
  headerContainer,
  headerSeparator,
  identity,
  meta,
  metaRow,
  metaValue,
  obelusLink,
  tab,
  tabLabelCount,
  tabList,
  tabs,
} from './publicRecord.css';

export function PublicRecord() {
  const { userName } = useParams({ from: '/u/$userName' });
  const trpc = useTRPC();
  const { data: profile, isLoading, isError } = useQuery(trpc.publicRecord.profile.queryOptions({ userName }));

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isError || !profile) {
    return (
      <>
        <AppHeader />
        <NotFound />
      </>
    );
  }

  const oldestRecord = profile.oldestRecord ? dayjs(profile.oldestRecord) : null;

  return (
    <>
      <AppHeader>
        <div className={headerContainer}>
          <span className={headerSeparator}>/</span>
          <span className={handle}>
            <FormattedMessage defaultMessage="{userName} · public" values={{ userName: profile.userName }} />
          </span>
        </div>
      </AppHeader>
      <section className={identity}>
        <div>
          <h1 className={typography.display}>{userName}</h1>
          <p className={bio}>
            {oldestRecord ? (
              <FormattedMessage
                defaultMessage="A reading record kept since {startYear}."
                values={{ startYear: oldestRecord.format('YYYY') }}
              />
            ) : (
              <FormattedMessage defaultMessage="A reading record." />
            )}
          </p>
        </div>
        <div className={meta}>
          <MetaRow
            title={<FormattedMessage defaultMessage="since" />}
            value={oldestRecord ? oldestRecord.format('MMMM YYYY') : <FormattedMessage defaultMessage="N/A" />}
          />
          <MetaRow title={<FormattedMessage defaultMessage="entries" />} value={profile.totalRecords} />
          <MetaRow
            title={
              <FormattedMessage
                defaultMessage="finished in {currentYear}"
                values={{ currentYear: dayjs().format('YYYY') }}
              />
            }
            value={profile.finishedThisYear}
          />
        </div>
      </section>
      <Tabs defaultSelectedKey="reading" className={tabs}>
        <TabList className={tabList}>
          <Tab id="reading" className={tab}>
            <FormattedMessage
              defaultMessage="reading <mute>· {count}</mute>"
              values={{
                mute: (chunks) => <span className={tabLabelCount}>{chunks}</span>,
                count: profile.readingCount,
              }}
            />
          </Tab>
          <Tab id="finished" className={tab}>
            <FormattedMessage
              defaultMessage="read <mute>· {count}</mute>"
              values={{
                mute: (chunks) => <span className={tabLabelCount}>{chunks}</span>,
                count: profile.finishedCount,
              }}
            />
          </Tab>
          <Tab id="planned" className={tab}>
            <FormattedMessage
              defaultMessage="planned <mute>· {count}</mute>"
              values={{
                mute: (chunks) => <span className={tabLabelCount}>{chunks}</span>,
                count: profile.plannedCount,
              }}
            />
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="reading">
            <PublicBookList userName={userName} status="reading" sortField="started_at" />
          </TabPanel>
          <TabPanel id="finished">
            <PublicBookList userName={userName} status="finished" sortField="finished_at" />
          </TabPanel>
          <TabPanel id="planned">
            <PublicBookList userName={userName} status="planned" sortField="last_activity" />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <footer className={footer}>
        <span>
          <FormattedMessage
            defaultMessage="kept with <link>obelus</link>"
            values={{
              link: (chunks) => (
                <a className={obelusLink} href="https://github.com/s992/obelus" rel="noopener noreferrer">
                  {chunks}
                </a>
              ),
            }}
          />
        </span>
        <span>
          <FormattedMessage
            defaultMessage="read-only · last touched {lastUpdated}"
            values={{ lastUpdated: dayjs(profile.lastUpdated).format('MMMM D, YYYY') }}
          />
        </span>
      </footer>
    </>
  );
}

function MetaRow({ title, value }: { title: ReactNode; value: ReactNode }) {
  return (
    <div className={metaRow}>
      <span>{title}</span>
      <span className={metaValue}>{value}</span>
    </div>
  );
}
