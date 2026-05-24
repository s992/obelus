import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { flex } from '@/style';
import type { Status } from '@obelus/shared/types';

import { button, container, responsive } from './unreadBookActions.css';

export type Props = {
  layout: keyof typeof container;
  onAction: (status: Status) => void;
  isProcessing?: boolean;
};

export function UnreadBookActions({ layout, onAction, isProcessing }: Props) {
  return (
    <div className={clsx(container[layout], responsive)}>
      {isProcessing ? (
        <div className={flex.center}>
          <LoadingSpinner size="small" />
        </div>
      ) : (
        <>
          <Button className={button} variant="link" onPress={() => onAction('finished')}>
            <FormattedMessage defaultMessage="mark read" />
          </Button>
          <Button className={button} variant="link" onPress={() => onAction('planned')}>
            <FormattedMessage defaultMessage="add to planned" />
          </Button>
          <Button className={button} variant="link" onPress={() => onAction('reading')}>
            <FormattedMessage defaultMessage="start reading" />
          </Button>
        </>
      )}
    </div>
  );
}
