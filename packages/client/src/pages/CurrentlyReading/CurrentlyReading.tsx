import { useQuery } from '@tanstack/react-query';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '../../client';
import { BooksTable } from '../../components/BooksTable';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { flex } from '../../style';

export function CurrentlyReading() {
  const intl = useIntl();
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.record.list.queryOptions({ status: 'reading' }));

  if (isLoading) {
    return (
      <div className={flex.center}>
        <LoadingSpinner size="xlarge" />
      </div>
    );
  }

  return (
    <BooksTable
      books={data?.books ?? []}
      label={intl.formatMessage({ defaultMessage: 'Currently reading' })}
      columns={{ finished: false, added: false }}
      renderEmptyState={() => <FormattedMessage defaultMessage="Not currently reading any books." />}
    />
  );
}
