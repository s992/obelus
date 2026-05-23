import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Button, type ButtonProps } from 'react-aria-components';

import { button, buttonSize } from './iconButton.css';

type Props = {
  ['aria-label']: string;
  children: ReactNode;
  className?: string;
  variant?: keyof typeof button;
  size?: keyof typeof buttonSize;
} & ButtonProps;

export function IconButton({ className, variant = 'tertiary', size = 'default', ...rest }: Props) {
  return <Button {...rest} className={clsx(button[variant], buttonSize[size], className)} />;
}
