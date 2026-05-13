import type { ReactNode } from 'react';
import { Text } from 'react-aria-components';

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
      <Text slot="title">
        <strong>{title}</strong>
      </Text>
      <Text slot="description">
        <p className={formattedAlertBody}>{message} </p>
      </Text>
    </Alert>
  );
}
