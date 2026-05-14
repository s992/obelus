import { useQuery } from '@tanstack/react-query';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '../../client';
import { BooksTable } from '../../components/BooksTable';

export function Planned() {
  const intl = useIntl();
  const trpc = useTRPC();
  const query = useQuery(trpc.record.list.queryOptions({ status: 'planned' }));

  return (
    <BooksTable
      books={query.data?.books ?? []}
      label={intl.formatMessage({ defaultMessage: 'Planned' })}
      columns={{ started: false, finished: false }}
      renderEmptyState={() => <FormattedMessage defaultMessage="You haven't planned any future reads." />}
    />
  );
}
