import type { ReactNode } from 'react';

import { Alert, type Props as AlertProps } from './Alert';
import { formattedAlertBody } from './alert.css';

type Props = {
  variant: AlertProps['variant'];
  title: ReactNode;
  message: ReactNode;
};

export function FormattedAlert({ variant, title, message }: Props) {
  return (
    <Alert variant={variant}>
      <strong>{title} </strong>
      <p className={formattedAlertBody}>{message} </p>
    </Alert>
  );
}
