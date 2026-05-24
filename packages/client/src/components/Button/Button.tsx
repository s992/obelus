import clsx from 'clsx';
import { Button as AriaButton, type ButtonProps } from 'react-aria-components';

import { LoadingSpinner } from '@/components/LoadingSpinner/LoadingSpinner';

import { button } from './button.css';

type Props = {
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
      {isProcessing ? <LoadingSpinner size="med" /> : children}
    </AriaButton>
  );
}
