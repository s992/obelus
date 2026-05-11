import clsx from 'clsx';
import { Button as AriaButton, type ButtonProps } from 'react-aria-components';

import { LoadingSpinner } from '../LoadingSpinner/LoadingSpinner';
import { button } from './button.css';

type Props = {
  variant?: keyof typeof button;
  isProcessing?: boolean;
} & ButtonProps;

export function Button({ children, className, isDisabled, isProcessing = false, variant = 'primary', ...rest }: Props) {
  return (
    <AriaButton {...rest} className={clsx(button[variant], className)} isDisabled={isDisabled || isProcessing}>
      {isProcessing ? <LoadingSpinner size="med" /> : children}
    </AriaButton>
  );
}
