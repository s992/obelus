import { useQuery } from '@tanstack/react-query';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '../../client';
import { BooksTable } from '../../components/BooksTable';

export function CurrentlyReading() {
  const intl = useIntl();
  const trpc = useTRPC();
  const query = useQuery(trpc.record.list.queryOptions({ status: 'reading' }));

  return (
    <BooksTable
      books={query.data?.books ?? []}
      label={intl.formatMessage({ defaultMessage: 'Currently reading' })}
      columns={{ finished: false, added: false }}
      renderEmptyState={() => <FormattedMessage defaultMessage="Not currently reading any books." />}
    />
  );
}
