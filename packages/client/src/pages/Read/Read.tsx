import { useQuery } from '@tanstack/react-query';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '../../client';
import { BooksTable } from '../../components/BooksTable';

export function Read() {
  const intl = useIntl();
  const trpc = useTRPC();
  const query = useQuery(trpc.record.list.queryOptions({ status: 'finished' }));

  return (
    <BooksTable
      books={query.data?.books ?? []}
      label={intl.formatMessage({ defaultMessage: 'Finished' })}
      columns={{ added: false }}
      renderEmptyState={() => <FormattedMessage defaultMessage="You haven't finished any books yet." />}
    />
  );
}
