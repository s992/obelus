import type { Status } from '@obelus/shared/types';
import { FormattedMessage } from 'react-intl';

import { flex } from '../../style';
import { Button } from '../Button';
import { LoadingSpinner } from '../LoadingSpinner';
import { button, container } from './unreadBookActions.css';

export type Props = {
  layout: keyof typeof container;
  onAction: (status: Status) => void;
  isProcessing?: boolean;
};

export function UnreadBookActions({ layout, onAction, isProcessing }: Props) {
  return (
    <div className={container[layout]}>
      {isProcessing ? (
        <div className={flex.center}>
          <LoadingSpinner size="small" />
        </div>
      ) : (
        <>
          <Button className={button} variant="underlined" onPress={() => onAction('finished')}>
            <FormattedMessage defaultMessage="mark read" />
          </Button>
          <Button className={button} variant="underlined" onPress={() => onAction('planned')}>
            <FormattedMessage defaultMessage="add to planned" />
          </Button>
          <Button className={button} variant="underlined" onPress={() => onAction('reading')}>
            <FormattedMessage defaultMessage="start reading" />
          </Button>
        </>
      )}
    </div>
  );
}
