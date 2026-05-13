import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { vars } from '../../style';
import { alert } from './alert.css';

export type Props = {
  children: ReactNode;
  className?: string;
  variant: keyof typeof alert;
};

export function Alert({ children, className, variant }: Props) {
  return (
    <div role="alert" aria-live="polite" className={clsx(alert[variant], className)}>
      <AlertCircle color={vars.color.bad} />
      <div>{children}</div>
    </div>
  );
}
