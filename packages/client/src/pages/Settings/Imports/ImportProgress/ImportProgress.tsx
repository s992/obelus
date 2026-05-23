import type { ImportProgress, Maybe } from '@obelus/shared/types';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

import { typography } from '../../../../style';
import {
  bar,
  bullet,
  container,
  footerRow,
  headerFileName,
  headerLeft,
  headerRow,
  metaNumber,
  metaNumberError,
  pulse,
  segment,
} from './importProgress.css';

type Props = {
  fileName: Maybe<string>;
  progress: Maybe<ImportProgress>;
};

export function ImportProgress({ fileName, progress }: Props) {
  const { total = 0, pending = 0, succeeded = 0, failedInsert = 0, failedLookup = 0 } = progress ?? {};
  const succeededPercent = (succeeded / total) * 100;
  const failed = failedInsert + failedLookup;
  const erroredPercent = (failed / total) * 100;
  const pendingPercent = (pending / total) * 100;
  const processedPercent = ((succeeded + failed) / total) * 100;
  const isDone = failed + succeeded === total;

  return (
    <div className={container}>
      <div className={headerRow}>
        <div className={headerLeft}>
          {fileName && <span className={headerFileName}>{fileName}</span>}
          <span className={typography.uppercaseLabel}>
            <span className={clsx(bullet, { [pulse]: !isDone })} />
            {isDone ? <FormattedMessage defaultMessage="complete" /> : <FormattedMessage defaultMessage="importing" />}
          </span>
        </div>
        <span className={typography.uppercaseLabel}>
          <span className={metaNumber}>{succeeded}</span> · {total} ·{' '}
          <span className={metaNumber}>{Math.round(Number.isNaN(processedPercent) ? 0 : processedPercent)}</span>%
        </span>
      </div>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={succeeded} className={bar}>
        <span className={segment.succeeded} style={{ width: `${succeededPercent}%` }} />
        <span className={segment.found} style={{ width: `${pendingPercent}%` }} />
        <span className={segment.failed} style={{ width: `${erroredPercent}%` }} />
      </div>
      <div className={footerRow}>
        <span>
          <FormattedMessage
            defaultMessage="<num>{succeeded}</num> imported"
            values={{ succeeded, num: (chunks) => <span className={metaNumber}>{chunks}</span> }}
          />
        </span>
        <span>·</span>
        <span>
          <FormattedMessage
            defaultMessage="<num>{failed}</num> failed"
            values={{ failed, num: (chunks) => <span className={metaNumberError}>{chunks}</span> }}
          />
        </span>
        <span>·</span>
        <span>
          <FormattedMessage
            defaultMessage="<num>{pending}</num> pending"
            values={{ pending, num: (chunks) => <span className={metaNumber}>{chunks}</span> }}
          />
        </span>
        <span>·</span>
        <span>
          <FormattedMessage defaultMessage="of {total}" values={{ total }} />
        </span>
      </div>
    </div>
  );
}
