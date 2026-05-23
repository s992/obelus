import type { Maybe } from '@obelus/shared/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@trpc/tanstack-react-query';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Disclosure, DisclosurePanel, DropZone, FileTrigger } from 'react-aria-components';
import { FormattedMessage } from 'react-intl';

import { useTRPC } from '../../../client';
import { FormattedAlert } from '../../../components/Alert';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { flex, typography } from '../../../style';
import { ImportProgress } from './ImportProgress';
import {
  disclosure,
  disclosureButton,
  disclosureButtonHover,
  dropZone,
  dropZoneButton,
  innerDropZone,
  sectionDate,
  sectionExpandIcon,
  sectionHeader,
  sectionHeaderH3,
  sectionHeaderMeta,
  sectionMetric,
  sectionMetricContainer,
  sectionRow,
} from './imports.css';

export function Imports() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [expandedSections, setExpandedSections] = useState(new Map());
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const { data: importRecords } = useQuery(trpc.import.list.queryOptions());
  const {
    mutate: uploadFile,
    isPending: isUploading,
    isError: isFailedUpload,
    isSuccess: isSuccessfulUpload,
  } = useMutation({
    mutationFn: async (file: File) => {
      setUploadedFile(file.name);

      const form = new FormData();
      form.append('file', file);

      const res = await fetch(`${window.location.origin}/api/import`, { method: 'POST', body: form });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status}`);
      }
    },
    onError: async () => {
      setUploadedFile(null);
    },
  });
  const { data: progress } = useSubscription(trpc.import.status.subscriptionOptions());
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

  useEffect(() => {
    if (!progress) {
      return;
    }

    const processed = progress.failedInsert + progress.failedLookup + progress.succeeded;

    if (processed === progress.total) {
      queryClient.invalidateQueries({ queryKey: trpc.import.list.queryKey() });
    }
  }, [progress]);

  return (
    <div>
      <p className={typography.body}>
        <FormattedMessage defaultMessage="Upload a Goodreads library export. Each row becomes a book in the record, preserving shelves as planned, read, or finished. Editions are matched against the catalog; ambiguous matches and missing metadata are reported below." />
      </p>
      <div className={flex.column}>
        <div className={sectionHeader}>
          <h3 className={sectionHeaderH3}>
            <FormattedMessage defaultMessage="New Import" />
          </h3>
          <span className={sectionHeaderMeta}>
            <FormattedMessage defaultMessage="accepts csv - goodreads format" />
          </span>
        </div>
        {!isUploading && isFailedUpload && (
          <FormattedAlert
            variant="error"
            title={<FormattedMessage defaultMessage="Import failed" />}
            message={<FormattedMessage defaultMessage="Double check your file format and try again." />}
          />
        )}
        {isSuccessfulUpload && uploadedFile ? (
          <div className={dropZone}>
            <div className={innerDropZone}>
              <ImportProgress fileName={uploadedFile} progress={progress} />
            </div>
          </div>
        ) : (
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
        )}
      </div>
      <div>
        <div className={sectionHeader}>
          <h3 className={sectionHeaderH3}>
            <FormattedMessage defaultMessage="History" />
          </h3>
          <span className={sectionHeaderMeta}>
            <FormattedMessage
              defaultMessage="{imports} attempts · {successes} imported · {failures} failed"
              values={{ imports: importRecords?.length ?? 0, successes, failures }}
            />
          </span>
        </div>
        {importRecords?.map((record) => (
          <Disclosure
            key={`${record.createdAt}-${record.completedAt}`}
            className={disclosure}
            onExpandedChange={(expanded) => {
              setExpandedSections((current) => {
                return new Map(current).set(record.completedAt, expanded);
              });
            }}
          >
            <Button
              slot={record.failures.length ? 'trigger' : undefined}
              className={clsx(disclosureButton, { [disclosureButtonHover]: record.failures.length > 0 })}
            >
              <div className={sectionRow}>
                <span className={clsx(typography.label, sectionDate)}>{formatDate(record.createdAt)}</span>
                <span className={typography.label}>{formatTime(record.createdAt)}</span>
                <div className={sectionMetricContainer}>
                  <span className={sectionMetric}>{record.successCount + record.failures.length}</span>
                  <span className={typography.uppercaseLabel}>
                    <FormattedMessage defaultMessage="Imported" />
                  </span>
                </div>
                <div className={sectionMetricContainer}>
                  <span className={sectionMetric}>{record.failures.length}</span>
                  <span className={typography.uppercaseLabel}>
                    <FormattedMessage defaultMessage="Failed" />
                  </span>
                </div>
                <div className={sectionMetricContainer}>
                  <span className={sectionMetric}>
                    <Elapsed d1={record.createdAt} d2={record.completedAt ?? ''} />
                  </span>
                  <span className={typography.uppercaseLabel}>
                    <FormattedMessage defaultMessage="Elapsed" />
                  </span>
                </div>
              </div>
              {record.failures.length > 0 && (
                <div className={sectionExpandIcon}>
                  {expandedSections.get(record.completedAt) ? <Minus /> : <Plus />}
                </div>
              )}
            </Button>
            <DisclosurePanel>
              <span className={typography.label}>
                <FormattedMessage defaultMessage="Failed Books" />
              </span>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {record.failures.map((failure) => (
                  <li key={failure.id} className={typography.body}>
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

  if (!d1Parsed.isValid() || !d2Parsed.isValid()) {
    return <FormattedMessage defaultMessage="N/A" />;
  }

  let diff = Math.abs(d1Parsed.diff(d2Parsed, 'second'));

  if (diff < 60) {
    return <FormattedMessage defaultMessage="{diff}sec" values={{ diff }} />;
  }

  diff = Math.abs(d1Parsed.diff(d2Parsed, 'minute'));

  return <FormattedMessage defaultMessage="{diff}min" values={{ diff }} />;
}
