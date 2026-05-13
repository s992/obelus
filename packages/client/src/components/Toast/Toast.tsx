import { UNSTABLE_Toast as AriaToast, type ToastProps } from 'react-aria-components';

import type { ToastContent } from './queue';
import { toast } from './toast.css';

type Props = {} & ToastProps<ToastContent>;

export function Toast(props: Props) {
  return <AriaToast {...props} className={toast} />;
}
