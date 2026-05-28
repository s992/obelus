import { FormattedMessage } from 'react-intl';

import { useJudgmentI18n, useRecordStatusI18n } from '@/hooks/useI18n';
import { judgment } from '@/style';
import type { Maybe, RecordJson } from '@obelus/shared/types';

export function StatusCell({ record }: { record: Maybe<RecordJson> }) {
  const statusI18n = useRecordStatusI18n();
  const judgmentI18n = useJudgmentI18n();

  if (!record) {
    return <FormattedMessage defaultMessage="unread" />;
  }

  if (record.status === 'finished' && record.judgment) {
    return <span className={judgment[record.judgment]}>{judgmentI18n(record.judgment)}</span>;
  }

  return statusI18n(record.status);
}
