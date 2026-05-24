import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormattedMessage } from 'react-intl';

import { useTRPC } from '@/client';
import { separator } from '@/components/BookList/bookList.css';
import { Button } from '@/components/Button';
import { useListPageContext } from '@/pages/ListPage/context';
import type { Book, Status } from '@obelus/shared/types';

import { container } from './quickActions.css';

type Props = {
  book: Book;
};

export function UntrackedQuickActions({ book }: Props) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { queryKey } = useListPageContext();
  const { mutate: createRecord, isPending } = useMutation(
    trpc.record.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey });
      },
    }),
  );

  const makeRecord = (status: Status) => () => {
    createRecord({ bookId: book.id, status });
  };

  return (
    <div className={container}>
      <Button variant="underlined" isDisabled={isPending} onPress={makeRecord('reading')}>
        <FormattedMessage defaultMessage="start reading" />
      </Button>
      <span className={separator}>·</span>
      <Button variant="underlined" isDisabled={isPending} onPress={makeRecord('finished')}>
        <FormattedMessage defaultMessage="already read" />
      </Button>
      <span className={separator}>·</span>
      <Button variant="underlined" isDisabled={isPending} onPress={makeRecord('planned')}>
        <FormattedMessage defaultMessage="add to planned" />
      </Button>
    </div>
  );
}
