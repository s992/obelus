import { createFileRoute } from '@tanstack/react-router';
import { FormattedMessage } from 'react-intl';

import { ListPage } from '@/pages/ListPage';

function CurrentlyReading() {
  return (
    <ListPage
      status="reading"
      sortField="started_at"
      renderEmptyState={() => <FormattedMessage defaultMessage="Not currently reading any books." />}
    />
  );
}

export const Route = createFileRoute('/_layout/_authenticated/')({
  component: CurrentlyReading,
});
