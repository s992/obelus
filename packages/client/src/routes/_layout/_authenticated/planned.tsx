import { createFileRoute } from '@tanstack/react-router';
import { FormattedMessage } from 'react-intl';

import { ListPage } from '../../../pages/ListPage';

function Planned() {
  return (
    <ListPage
      status="planned"
      sortField="last_activity"
      renderEmptyState={() => <FormattedMessage defaultMessage="You haven't planned any future reads." />}
    />
  );
}

export const Route = createFileRoute('/_layout/_authenticated/planned')({
  component: Planned,
});
