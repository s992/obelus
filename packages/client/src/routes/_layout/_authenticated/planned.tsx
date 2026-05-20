import { createFileRoute } from '@tanstack/react-router';
import { FormattedMessage, useIntl } from 'react-intl';

import { BookList } from '../../../pages/BookList';

function Planned() {
  const intl = useIntl();

  return (
    <BookList
      status="planned"
      label={intl.formatMessage({ defaultMessage: 'Planned' })}
      sortField="last_activity"
      columns={{ started: false, finished: false }}
      renderEmptyState={() => <FormattedMessage defaultMessage="You haven't planned any future reads." />}
    />
  );
}

export const Route = createFileRoute('/_layout/_authenticated/planned')({
  component: Planned,
});
