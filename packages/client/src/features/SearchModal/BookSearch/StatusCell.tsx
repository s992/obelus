import type { Maybe, RecordJson } from '@obelus/shared/types';
import { FormattedMessage } from 'react-intl';

import { judgment } from '@/style';

export function StatusCell({ record }: { record: Maybe<RecordJson> }) {
  if (!record) {
    return <FormattedMessage defaultMessage="unread" />;
  }

  if (record.status === 'finished' && record.judgment) {
    return <span className={judgment[record.judgment]}>{record.judgment}</span>;
  }

  return record.status;
}
