import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@trpc/tanstack-react-query';
import { CircleQuestionMark } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button as AriaButton, DropZone, FileTrigger } from 'react-aria-components';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '@/client';
import { FormattedAlert } from '@/components/Alert';
import { IconButton } from '@/components/IconButton';
import { flex, typography } from '@/style';
import type { Maybe } from '@obelus/shared/types';

import { HelpModal } from './HelpModal';
import { ImportProgress } from './ImportProgress';
import { ImportRecord } from './ImportRecord';
import {
  dropZone,
  dropZoneButton,
  importHistoryContainer,
  innerDropZone,
  sectionHeader,
  sectionHeaderH3,
  sectionHeaderMeta,
} from './imports.css';

export function Imports() {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [expandedSections, setExpandedSections] = useState(new Map());
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const { data: importRecords } = useQuery(trpc.import.list.queryOptions());
  const {
    mutate: uploadFile,
    isPending: isUploading,
    isError: isFailedUpload,
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

    if (progress.status === 'complete') {
      queryClient.invalidateQueries({ queryKey: trpc.import.list.queryKey() });
    }
  }, [progress, queryClient, trpc.import.list]);

  return (
    <div>
      <p className={typography.body}>
        <FormattedMessage defaultMessage="Upload a Goodreads library export. Each row becomes a book in the record, preserving shelves as planned, read, or finished. Editions are matched against the catalog; ambiguous matches and missing metadata are reported below. Imports will take a minium of one second per CSV row due to Hardcover rate-limiting." />
      </p>
      <div className={flex.column}>
        <div className={sectionHeader}>
          <h3 className={sectionHeaderH3}>
            <FormattedMessage defaultMessage="New Import" />
          </h3>
          <span className={sectionHeaderMeta}>
            <FormattedMessage defaultMessage="accepts csv - goodreads format" />
            <IconButton
              variant="tertiary"
              aria-label={intl.formatMessage({ defaultMessage: 'Click for format help' })}
              size="small"
              onPress={() => setIsHelpModalOpen(true)}
            >
              <CircleQuestionMark />
            </IconButton>
          </span>
        </div>
        {!isUploading && isFailedUpload && (
          <FormattedAlert
            variant="error"
            title={<FormattedMessage defaultMessage="Import failed" />}
            message={<FormattedMessage defaultMessage="Double check your file format and try again." />}
          />
        )}
        {progress ? (
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
              <AriaButton className={dropZoneButton}>
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
              </AriaButton>
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
        <div className={importHistoryContainer}>
          {importRecords?.map((record) => (
            <ImportRecord
              key={`${record.createdAt}-${record.completedAt}`}
              record={record}
              isExpanded={!!expandedSections.get(record.completedAt)}
              onExpandedChange={(expanded) => {
                setExpandedSections((current) => {
                  return new Map(current).set(record.completedAt, expanded);
                });
              }}
            />
          ))}
        </div>
      </div>
      <HelpModal isOpen={isHelpModalOpen} onOpenChange={(open) => setIsHelpModalOpen(open)} />
    </div>
  );
}
