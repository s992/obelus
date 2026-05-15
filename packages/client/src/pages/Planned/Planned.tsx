import { useQuery } from '@tanstack/react-query';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '../../client';
import { BooksTable } from '../../components/BooksTable';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { flex } from '../../style';

export function Planned() {
  const intl = useIntl();
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.record.list.queryOptions({ status: 'planned' }));

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
      label={intl.formatMessage({ defaultMessage: 'Planned' })}
      columns={{ started: false, finished: false }}
      renderEmptyState={() => <FormattedMessage defaultMessage="You haven't planned any future reads." />}
    />
  );
}
