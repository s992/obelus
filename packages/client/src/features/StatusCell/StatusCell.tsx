import type { Judgment, Maybe, Status } from '@obelus/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '../../client';
import { toastQueue } from '../../components/Toast';
import { UnreadBookActions, type Props as UnreadBookActionsProps } from '../../components/UnreadBookActions';
import { typography } from '../../style';
import { judgment as judgmentCss } from './statusCell.css';

type Props = {
  bookId: number;
  seriesId?: Maybe<number>;
  layout: UnreadBookActionsProps['layout'];
  status?: Maybe<Status>;
  judgment?: Maybe<Judgment>;
};

export function StatusCell({ bookId, seriesId, layout, status, judgment }: Props) {
  const intl = useIntl();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate: createRecord, isPending } = useMutation(
    trpc.record.create.mutationOptions({
      onSuccess: async () => {
        if (seriesId) {
          await queryClient.invalidateQueries({ queryKey: trpc.book.seriesById.queryKey({ id: seriesId }) });
        }

        await queryClient.invalidateQueries({ queryKey: trpc.book.byId.queryKey({ id: bookId }) });
      },
      onError: () => {
        toastQueue.add({
          variant: 'error',
          title: intl.formatMessage({ defaultMessage: 'Failed to update record.' }),
          message: intl.formatMessage({ defaultMessage: 'Please refresh your browser window and try again. ' }),
        });
      },
    }),
  );

  if (!status) {
    return (
      <UnreadBookActions
        layout={layout}
        isProcessing={isPending}
        onAction={(newStatus) => createRecord({ bookId, status: newStatus })}
      />
    );
  }

  if (!judgment) {
    return <span className={typography.body}>{status}</span>;
  }

  return <span className={judgmentCss[judgment]}>{judgment}</span>;
}
