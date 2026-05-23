import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { type ReactNode, useMemo } from 'react';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'react-aria-components';
import { FormattedMessage } from 'react-intl';

import { useTRPC } from '../../client';
import { AppHeader } from '../../components/AppHeader';
import { FullPageSpinner } from '../../components/FullPageSpinner';
import { NotFound } from '../../components/NotFound';
import { useFormatDate } from '../../hooks/useFormatDate';
import { typography } from '../../style';
import { PublicBookList } from './PublicBookList';
import {
  bio,
  footer,
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
  tabPanel,
  tabs,
} from './publicRecord.css';

export function PublicRecord() {
  const { userName } = useParams({ from: '/u/$userName' });
  const trpc = useTRPC();
  const { data: profile, isLoading, isError } = useQuery(trpc.publicRecord.profile.queryOptions({ userName }));
  const formatYear = useFormatDate('YYYY');
  const formatLongMonthYear = useFormatDate('MMMM YYYY');
  const formatFullDate = useFormatDate('MMMM D, YYYY');
  const today = useMemo(() => new Date().toISOString(), []);

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

  return (
    <>
      <AppHeader>
        <div className={headerContainer}>
          <span className={headerSeparator}>/</span>
          <span className={typography.uppercaseLabel}>
            <FormattedMessage defaultMessage="{userName} · public" values={{ userName: profile.userName }} />
          </span>
        </div>
      </AppHeader>
      <section className={identity}>
        <div>
          <h1 className={typography.display}>{userName}</h1>
          <p className={bio}>
            {profile.oldestRecord ? (
              <FormattedMessage
                defaultMessage="A reading record kept since {startYear}."
                values={{ startYear: formatYear(profile.oldestRecord) }}
              />
            ) : (
              <FormattedMessage defaultMessage="A reading record." />
            )}
          </p>
        </div>
        <div className={meta}>
          <MetaRow
            title={<FormattedMessage defaultMessage="since" />}
            value={formatLongMonthYear(profile.oldestRecord)}
          />
          <MetaRow title={<FormattedMessage defaultMessage="entries" />} value={profile.totalRecords} />
          <MetaRow
            title={
              <FormattedMessage
                defaultMessage="finished in {currentYear}"
                values={{ currentYear: formatYear(today) }}
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
          <TabPanel id="reading" className={tabPanel}>
            <PublicBookList userName={userName} status="reading" sortField="started_at" />
          </TabPanel>
          <TabPanel id="finished" className={tabPanel}>
            <PublicBookList userName={userName} status="finished" sortField="finished_at" />
          </TabPanel>
          <TabPanel id="planned" className={tabPanel}>
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
            values={{ lastUpdated: formatFullDate(profile.lastUpdated) }}
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
