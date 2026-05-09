import clsx from 'clsx';
import { Label as AriaLabel, type LabelProps } from 'react-aria-components';

import { label } from './label.css';

type Props = {
  hasError?: boolean;
} & LabelProps;

export function Label({ className, hasError, ...rest }: Props) {
  return (
    <AriaLabel
      {...rest}
      className={clsx(
        {
          [label.default]: !hasError,
          [label.error]: hasError,
        },
        className,
      )}
    />
  );
}
