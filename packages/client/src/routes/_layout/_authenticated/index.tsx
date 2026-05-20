import { createFileRoute } from '@tanstack/react-router';
import { FormattedMessage, useIntl } from 'react-intl';

import { BookList } from '../../../pages/BookList';

function CurrentlyReading() {
  const intl = useIntl();

  return (
    <BookList
      status="reading"
      label={intl.formatMessage({ defaultMessage: 'Currently reading' })}
      sortField="started_at"
      columns={{ finished: false, added: false }}
      renderEmptyState={() => <FormattedMessage defaultMessage="Not currently reading any books." />}
    />
  );
}

export const Route = createFileRoute('/_layout/_authenticated/')({
  component: CurrentlyReading,
});
