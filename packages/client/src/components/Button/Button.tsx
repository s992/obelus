import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Button as AriaButton, type ButtonProps } from 'react-aria-components';

import { FullContainerSpinner } from '../FullContainerSpinner';
import { button, hiddenChildren } from './button.css';

type Props = {
  children: ReactNode;
  variant?: keyof typeof button;
  isProcessing?: boolean;
  isSelected?: boolean;
} & ButtonProps;

export function Button({
  children,
  className,
  isDisabled,
  isProcessing = false,
  variant = 'primary',
  isSelected = false,
  ...rest
}: Props) {
  return (
    <AriaButton
      {...rest}
      className={clsx(button[variant], className)}
      isDisabled={isDisabled || isProcessing}
      data-selected={isSelected}
    >
      <div className={isProcessing ? hiddenChildren : undefined}>{children}</div>
      {isProcessing && <FullContainerSpinner />}
    </AriaButton>
  );
}
