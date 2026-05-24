import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormattedMessage } from 'react-intl';

import { useTRPC } from '@/client';
import { separator } from '@/components/BookList/bookList.css';
import { Button } from '@/components/Button';
import { useListPageContext } from '@/pages/ListPage/context';
import type { Book, Judgment } from '@obelus/shared/types';

import { container } from './quickActions.css';

type Props = {
  book: Book;
};

export function JudgmentQuickActions({ book }: Props) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { queryKey } = useListPageContext();
  const { mutate: updateBook, isPending } = useMutation(
    trpc.record.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey });
      },
    }),
  );
  const { record } = book;

  if (!record) {
    return null;
  }

  const setJudgment = (judgment: Judgment) => () =>
    updateBook({ id: record.id, status: 'finished', judgment, finishedAt: new Date().toISOString() });

  return (
    <div className={container}>
      <Button variant="underlined" isDisabled={isPending} onPress={setJudgment('accepted')}>
        <FormattedMessage defaultMessage="accept" />
      </Button>
      <span className={separator}>·</span>
      <Button variant="underlined" isDisabled={isPending} onPress={setJudgment('mixed')}>
        <FormattedMessage defaultMessage="mixed" />
      </Button>
      <span className={separator}>·</span>
      <Button variant="underlined" isDisabled={isPending} onPress={setJudgment('rejected')}>
        <FormattedMessage defaultMessage="reject" />
      </Button>
    </div>
  );
}
