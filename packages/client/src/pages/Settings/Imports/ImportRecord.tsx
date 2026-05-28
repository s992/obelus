import clsx from 'clsx';
import dayjs from 'dayjs';
import { Minus, Plus } from 'lucide-react';
import { Button as AriaButton, Disclosure, DisclosurePanel } from 'react-aria-components';
import { FormattedMessage } from 'react-intl';

import { StatusDot } from '@/components/StatusDot';
import { useFormatDate } from '@/hooks/useFormatDate';
import { useImportFailureI18n } from '@/hooks/useI18n';
import { typography } from '@/style';
import type { ImportRecordJson } from '@obelus/shared/types';

import {
  disclosure,
  disclosureButton,
  disclosureButtonHover,
  failureList,
  failureListItem,
  failurePanel,
  failureReason,
  sectionDate,
  sectionExpandIcon,
  sectionMetric,
  sectionMetricContainer,
  sectionRow,
} from './imports.css';

type Props = {
  record: ImportRecordJson;
  isExpanded: boolean;
  onExpandedChange: (open: boolean) => void;
};

export function ImportRecord({ record, isExpanded, onExpandedChange }: Props) {
  const failureI18n = useImportFailureI18n();
  const formatDate = useFormatDate('D MMM YYYY');
  const formatTime = useFormatDate('HH:mm');

  return (
    <Disclosure className={disclosure} onExpandedChange={onExpandedChange}>
      <AriaButton
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
        {record.failures.length > 0 && <div className={sectionExpandIcon}>{isExpanded ? <Minus /> : <Plus />}</div>}
      </AriaButton>
      <DisclosurePanel>
        <div className={failurePanel}>
          <span className={typography.uppercaseLabel}>
            <FormattedMessage defaultMessage="Failed Books" />
          </span>
          <ul className={failureList}>
            {record.failures.map((failure) => (
              <li key={failure.id} className={failureListItem}>
                <span className={typography.body}>
                  <FormattedMessage
                    defaultMessage="{title} · {author}"
                    values={{
                      title: <span className={typography.title}>{failure.title}</span>,
                      author: failure.author,
                    }}
                  />
                </span>
                <span className={failureReason}>
                  <StatusDot variant={failure.reason === 'cannot_find' ? 'bad' : 'currentColor'} />
                  {failureI18n(failure.reason)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </DisclosurePanel>
    </Disclosure>
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
