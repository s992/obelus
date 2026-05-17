import type { Maybe } from '@obelus/shared/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button, Disclosure, DisclosurePanel, DropZone, FileTrigger } from 'react-aria-components';
import { FormattedMessage } from 'react-intl';

import { useTRPC } from '../../client';
import { FormattedAlert } from '../../components/Alert';
import { useFormatDate } from '../../hooks/useFormatDate';
import { typography } from '../../style';
import {
  disclosure,
  disclosureButton,
  dropZone,
  dropZoneButton,
  importSection,
  importSectionHeader,
  importSectionHeaderH3,
  importSectionHeaderMeta,
  importSectionMetric,
  importSectionMetricContainer,
  importSectionMetricLabel,
  importSectionRow,
} from './settings.css';

export function Imports() {
  const trpc = useTRPC();
  const [expandedSections, setExpandedSections] = useState(new Map());
  const [startedUpload, setStartedUpload] = useState(false);
  const { data: importRecords } = useQuery(trpc.import.list.queryOptions());
  const {
    mutate: uploadFile,
    isPending: isUploading,
    isError: isFailedUpload,
  } = useMutation({
    mutationFn: (file: File) => {
      setStartedUpload(true);

      const form = new FormData();
      form.append('file', file);

      return fetch(`${window.location.origin}/api/import`, { method: 'POST', body: form });
    },
  });
  const formatDate = useFormatDate('D MMM YYYY');
  const formatTime = useFormatDate('HH:mm');
  const successes = importRecords?.reduce((acc, record) => acc + record.successCount, 0);
  const failures = importRecords?.reduce((acc, record) => acc + record.failures.length, 0);

  function onFile(file: Maybe<File>) {
    if (!file) {
      return;
    }

    uploadFile(file);
  }

  return (
    <div>
      <p className={typography.body}>
        <FormattedMessage defaultMessage="Upload a Goodreads library export. Each row becomes a book in the record, preserving shelves as planned, read, or finished. Editions are matched against the catalog; ambiguous matches and missing metadata are reported below." />
      </p>
      <div className={importSection}>
        <div className={importSectionHeader}>
          <h3 className={importSectionHeaderH3}>
            <FormattedMessage defaultMessage="New Import" />
          </h3>
          <span className={importSectionHeaderMeta}>
            <FormattedMessage defaultMessage="accepts csv - goodreads format" />
          </span>
        </div>
        {startedUpload && !isUploading && !isFailedUpload && (
          <FormattedAlert
            variant="success"
            title={<FormattedMessage defaultMessage="Import started" />}
            message={<FormattedMessage defaultMessage="Check back in a few minutes." />}
          />
        )}
        {startedUpload && !isUploading && isFailedUpload && (
          <FormattedAlert
            variant="error"
            title={<FormattedMessage defaultMessage="Import failed" />}
            message={<FormattedMessage defaultMessage="Double check your file format and try again." />}
          />
        )}
        <DropZone
          className={dropZone}
          onDrop={async (e) => {
            const fileItem = e.items.find((item) => item.kind === 'file');
            const file = await fileItem?.getFile();
            onFile(file);
          }}
        >
          <FileTrigger
            acceptedFileTypes={['text/csv']}
            onSelect={(files) => {
              if (!files) {
                return;
              }

              onFile(Array.from(files)[0]);
            }}
          >
            <Button className={dropZoneButton}>
              <span className={typography.display}>÷</span>
              <span className={typography.title}>
                <FormattedMessage defaultMessage="drop your goodreads_library_export.csv here" />
              </span>
              <span className={typography.body}>
                <FormattedMessage
                  defaultMessage="or <highlight>select a file</highlight> from disk"
                  values={{
                    highlight: (chunks) => <span style={{ textDecoration: 'underline' }}>{chunks}</span>,
                  }}
                />
              </span>
            </Button>
          </FileTrigger>
        </DropZone>
      </div>
      <div>
        <div className={importSectionHeader}>
          <h3 className={importSectionHeaderH3}>
            <FormattedMessage defaultMessage="History" />
          </h3>
          <span className={importSectionHeaderMeta}>
            <FormattedMessage
              defaultMessage="{imports} attempts · {successes} imported · {failures} failed"
              values={{ imports: importRecords?.length ?? 0, successes, failures }}
            />
          </span>
        </div>
        {importRecords?.map((record) => (
          <Disclosure
            key={record.completedAt}
            className={disclosure}
            onExpandedChange={(expanded) => {
              setExpandedSections((current) => {
                return new Map(current).set(record.completedAt, expanded);
              });
            }}
          >
            <Button slot="trigger" className={disclosureButton}>
              <div className={importSectionRow}>
                <span className={typography.label}>{formatDate(record.createdAt)}</span>
                <span className={typography.label}>{formatTime(record.createdAt)}</span>
                <div className={importSectionMetricContainer}>
                  <span className={importSectionMetric}>{record.successCount + record.failures.length}</span>
                  <span className={importSectionMetricLabel}>
                    <FormattedMessage defaultMessage="Imported" />
                  </span>
                </div>
                <div className={importSectionMetricContainer}>
                  <span className={importSectionMetric}>{record.failures.length}</span>
                  <span className={importSectionMetricLabel}>
                    <FormattedMessage defaultMessage="Failed" />
                  </span>
                </div>
                <div className={importSectionMetricContainer}>
                  <span className={importSectionMetric}>
                    <Elapsed d1={record.createdAt} d2={record.completedAt ?? ''} />
                  </span>
                  <span className={importSectionMetricLabel}>
                    <FormattedMessage defaultMessage="Elapsed" />
                  </span>
                </div>
              </div>
              {expandedSections.get(record.completedAt) ? <Minus /> : <Plus />}
            </Button>
            <DisclosurePanel>
              <span className={typography.label}>
                <FormattedMessage defaultMessage="Failed Books" />
              </span>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {record.failures.map((failure) => (
                  <li key={failure.title} className={typography.body}>
                    <FormattedMessage
                      defaultMessage="{title} · {author}"
                      values={{ title: failure.title, author: failure.author }}
                    />
                  </li>
                ))}
              </ul>
            </DisclosurePanel>
          </Disclosure>
        ))}
      </div>
    </div>
  );
}

function Elapsed({ d1, d2 }: { d1: string; d2: string }) {
  const d1Parsed = dayjs(d1);
  const d2Parsed = dayjs(d2);
  let diff = Math.abs(d1Parsed.diff(d2Parsed, 'second'));

  if (diff < 60) {
    return <FormattedMessage defaultMessage="{diff}sec" values={{ diff }} />;
  }

  diff = Math.abs(d1Parsed.diff(d2Parsed, 'minute'));

  return <FormattedMessage defaultMessage="{diff}min" values={{ diff }} />;
}
