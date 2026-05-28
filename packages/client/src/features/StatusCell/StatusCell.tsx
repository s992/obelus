import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '@/client';
import { showMutationError } from '@/components/Toast';
import { UnreadBookActions, type Props as UnreadBookActionsProps } from '@/components/UnreadBookActions';
import { useJudgmentI18n, useRecordStatusI18n } from '@/hooks/useI18n';
import { judgment as judgmentCss } from '@/style';
import type { Judgment, Maybe, Status } from '@obelus/shared/types';

import { responsiveLabel, statusOrJudgment } from './statusCell.css';

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
  const statusI18n = useRecordStatusI18n();
  const judgmentI18n = useJudgmentI18n();
  const { mutate: createRecord, isPending } = useMutation(
    trpc.record.create.mutationOptions({
      onSuccess: async () => {
        if (seriesId) {
          await queryClient.invalidateQueries({ queryKey: trpc.book.seriesById.queryKey({ id: seriesId }) });
        }

        await queryClient.invalidateQueries({ queryKey: trpc.book.byId.queryKey({ id: bookId }) });
      },
      onError: () => {
        showMutationError(intl, intl.formatMessage({ defaultMessage: 'Failed to update record.' }));
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
    return (
      <span className={statusOrJudgment}>
        <span className={responsiveLabel}>
          <FormattedMessage defaultMessage="status: " />
        </span>
        {statusI18n(status)}
      </span>
    );
  }

  return (
    <span className={clsx(statusOrJudgment, judgmentCss[judgment])}>
      <span className={responsiveLabel}>
        <FormattedMessage defaultMessage="judgment: " />
      </span>
      {judgmentI18n(judgment)}
    </span>
  );
}
