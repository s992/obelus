import { createFileRoute } from '@tanstack/react-router';
import { FormattedMessage, useIntl } from 'react-intl';

import { BookList } from '../../pages/BookList';

function Read() {
  const intl = useIntl();

  return (
    <BookList
      status="finished"
      label={intl.formatMessage({ defaultMessage: 'Finished' })}
      sortField="finished_at"
      columns={{ added: false }}
      renderEmptyState={() => <FormattedMessage defaultMessage="You haven't finished any books yet." />}
    />
  );
}

export const Route = createFileRoute('/_authenticated/read')({
  component: Read,
});
