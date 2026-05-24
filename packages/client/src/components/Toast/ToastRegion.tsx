import { X } from 'lucide-react';
import { UNSTABLE_ToastRegion as AriaToastRegion, UNSTABLE_ToastContent as ToastContent } from 'react-aria-components';
import { useIntl } from 'react-intl';

import { FormattedAlert } from '@/components/Alert';
import { IconButton } from '@/components/IconButton';

import { toastQueue } from './queue';
import { Toast } from './Toast';
import { closeButton, toastRegion } from './toast.css';

export function ToastRegion() {
  const intl = useIntl();

  return (
    <AriaToastRegion queue={toastQueue} className={toastRegion}>
      {({ toast }) => (
        <Toast toast={toast} style={{ viewTransitionName: toast.key }}>
          <ToastContent>
            <FormattedAlert
              variant={toast.content.variant}
              title={toast.content.title}
              message={toast.content.message}
            />
          </ToastContent>
          <IconButton
            slot="close"
            variant="tertiary"
            className={closeButton}
            aria-label={intl.formatMessage({ defaultMessage: 'Close' })}
          >
            <X />
          </IconButton>
        </Toast>
      )}
    </AriaToastRegion>
  );
}
