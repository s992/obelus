import { useQuery } from '@tanstack/react-query';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '../../client';
import { BooksTable } from '../../components/BooksTable';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { flex } from '../../style';

export function Read() {
  const intl = useIntl();
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.record.list.queryOptions({ status: 'finished' }));

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
      label={intl.formatMessage({ defaultMessage: 'Finished' })}
      columns={{ added: false }}
      renderEmptyState={() => <FormattedMessage defaultMessage="You haven't finished any books yet." />}
    />
  );
}
