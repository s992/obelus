import clsx from 'clsx';
import { AlertCircle, CircleCheck } from 'lucide-react';
import type { ReactNode } from 'react';

import { vars } from '@/style';

import { alert } from './alert.css';

export type Props = {
  children: ReactNode;
  className?: string;
  variant: keyof typeof alert;
};

const ICON_MAP: Record<keyof typeof alert, ReactNode> = {
  error: <AlertCircle color={vars.color.bad} />,
  success: <CircleCheck color={vars.color.good} />,
};

export function Alert({ children, className, variant }: Props) {
  return (
    <div role="alert" aria-live="polite" className={clsx(alert[variant], className)}>
      {ICON_MAP[variant]}
      <div>{children}</div>
    </div>
  );
}
