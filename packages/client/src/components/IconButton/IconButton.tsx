import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Button, type ButtonProps } from 'react-aria-components';

import { button } from './iconButton.css';

type Props = {
  ['aria-label']: string;
  children: ReactNode;
  className?: string;
  variant?: keyof typeof button;
} & ButtonProps;

export function IconButton({ className, variant = 'tertiary', ...rest }: Props) {
  return <Button {...rest} className={clsx(button[variant], className)} />;
}
