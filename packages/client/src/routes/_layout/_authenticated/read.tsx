import { createFileRoute } from '@tanstack/react-router';
import { FormattedMessage } from 'react-intl';

import { ListPage } from '@/pages/ListPage';

function Read() {
  return (
    <ListPage
      status="finished"
      sortField="finished_at"
      renderEmptyState={() => <FormattedMessage defaultMessage="You haven't finished any books yet." />}
    />
  );
}

export const Route = createFileRoute('/_layout/_authenticated/read')({
  component: Read,
});
