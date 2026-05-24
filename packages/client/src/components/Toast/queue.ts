import type { ReactNode } from 'react';
import { UNSTABLE_ToastQueue as ToastQueue } from 'react-aria-components';
import { flushSync } from 'react-dom';

import type { Props as AlertProps } from '@/components/Alert';

export type ToastContent = {
  title: ReactNode;
  message: ReactNode;
  variant: AlertProps['variant'];
};

export const toastQueue = new ToastQueue<ToastContent>({
  wrapUpdate(fn) {
    if ('startViewTransition' in document) {
      document.startViewTransition(() => {
        flushSync(fn);
      });
    } else {
      fn();
    }
  },
});
