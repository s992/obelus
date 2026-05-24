import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormattedMessage } from 'react-intl';

import { useTRPC } from '@/client';
import { separator } from '@/components/BookList/bookList.css';
import { Button } from '@/components/Button';
import { useListPageContext } from '@/pages/ListPage/context';
import type { Book, Status } from '@obelus/shared/types';

import { container, removeButton } from './quickActions.css';

type Props = {
  book: Book;
};

export function PlannedQuickActions({ book }: Props) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { queryKey } = useListPageContext();
  const onSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };
  const { mutate: updateBook, isPending: isUpdating } = useMutation(trpc.record.update.mutationOptions({ onSuccess }));
  const { mutate: deleteRecord, isPending: isDeleting } = useMutation(
    trpc.record.delete.mutationOptions({ onSuccess }),
  );
  const { record } = book;

  if (!record) {
    return null;
  }

  const isPending = isUpdating || isDeleting;
  const setStatus = (status: Status) => () => {
    if (status === 'reading') {
      updateBook({ id: record.id, status, startedAt: new Date().toISOString() });
    }

    if (status === 'finished') {
      updateBook({ id: record.id, status, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString() });
    }
  };

  return (
    <div className={container}>
      <Button variant="link" isDisabled={isPending} onPress={setStatus('reading')}>
        <FormattedMessage defaultMessage="start reading" />
      </Button>
      <span className={separator}>·</span>
      <Button variant="link" isDisabled={isPending} onPress={setStatus('finished')}>
        <FormattedMessage defaultMessage="already read" />
      </Button>
      <span className={separator}>·</span>
      <Button
        variant="link"
        className={removeButton}
        isDisabled={isPending}
        onPress={() => {
          deleteRecord({ id: record.id });
        }}
      >
        <FormattedMessage defaultMessage="remove" />
      </Button>
    </div>
  );
}
