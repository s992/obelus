import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { FormattedAlert } from '../Alert';

type Props = {
  title?: ReactNode;
  message?: ReactNode;
};

export function LoadError({
  title = <FormattedMessage defaultMessage="Failed to load data." />,
  message = <FormattedMessage defaultMessage="Please refresh your browser window to try again." />,
}: Props) {
  return <FormattedAlert variant="error" title={title} message={message} />;
}
