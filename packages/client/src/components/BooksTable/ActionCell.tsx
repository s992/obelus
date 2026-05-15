import type { Judgment, Maybe, RecordJson } from '@obelus/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

import { useTRPC } from '../../client';
import { flex, judgment as judgmentCss, typography } from '../../style';
import { Button } from '../Button';
import { LoadingSpinner } from '../LoadingSpinner';

type Props = {
  record: Maybe<RecordJson>;
};

export function ActionCell({ record }: Props) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { mutate: updateRecord, isPending: isUpdatingRecord } = useMutation(
    trpc.record.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.record.list.queryKey() });
      },
    }),
  );

  if (!record) {
    return null;
  }

  if (isUpdatingRecord) {
    return (
      <div className={flex.verticalCenter}>
        <LoadingSpinner size="small" />
      </div>
    );
  }

  if (record.status === 'finished') {
    const judgment = record.judgment;

    if (!judgment) {
      return <FormattedMessage defaultMessage="unjudged" />;
    }

    return <span className={clsx(typography.body, judgmentCss[judgment])}>{judgment}</span>;
  }

  if (record.status === 'planned') {
    return (
      <>
        <Button
          variant="underlined"
          onPress={() => {
            updateRecord({ id: record.id, status: 'reading', startedAt: new Date().toISOString() });
          }}
        >
          <FormattedMessage defaultMessage="start reading" />
        </Button>
        <Button
          variant="underlined"
          onPress={() => {
            updateRecord({
              id: record.id,
              status: 'finished',
              startedAt: new Date().toISOString(),
              finishedAt: new Date().toISOString(),
            });
          }}
        >
          <FormattedMessage defaultMessage="mark read" />
        </Button>
        {/*TODO: delete support*/}
        {/*<Button variant="underlined">
          <FormattedMessage defaultMessage="delete" />
        </Button>*/}
      </>
    );
  }

  if (record.status === 'reading') {
    const finish = (judgment: Judgment) => () =>
      updateRecord({
        id: record.id,
        status: 'finished',
        judgment,
        finishedAt: new Date().toISOString(),
      });

    return (
      <>
        <Button variant="underlined" onPress={finish('accepted')}>
          <FormattedMessage defaultMessage="accept" />
        </Button>
        <Button variant="underlined" onPress={finish('rejected')}>
          <FormattedMessage defaultMessage="reject" />
        </Button>
        <Button variant="underlined" onPress={finish('mixed')}>
          <FormattedMessage defaultMessage="mixed" />
        </Button>
      </>
    );
  }

  return null;
}
