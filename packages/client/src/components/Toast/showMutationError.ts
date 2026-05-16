import type { IntlShape } from 'react-intl';

import { toastQueue } from './queue';

export function showMutationError(intl: IntlShape, title: string) {
  toastQueue.add({
    variant: 'error',
    title: title,
    message: intl.formatMessage({ defaultMessage: 'Please refresh your browser window and try again.' }),
  });
}
