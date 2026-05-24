import { JudgmentEnumSchema, RecordStatusEnumSchema } from '@obelus/shared/schema';
import type { RecordJson } from '@obelus/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import z from 'zod';

import { useTRPC } from '@/client';
import { FormattedAlert } from '@/components/Alert';
import { Button } from '@/components/Button';
import { useForm } from '@/form';

import { container, formContainer, submitButton } from './revisionForm.css';

type Props = {
  bookId: number;
  record: RecordJson;
};

export function RevisionForm({ bookId, record }: Props) {
  const intl = useIntl();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const {
    mutate: updateRecord,
    isPending,
    isError,
  } = useMutation(
    trpc.record.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.book.byId.queryKey({ id: bookId }) });
      },
    }),
  );
  const schema = useMemo(
    () =>
      z.object({
        startedAt: z.date().nullable(),
        finishedAt: z.date().nullable(),
        judgment: JudgmentEnumSchema.nullable(),
        status: RecordStatusEnumSchema,
      }),
    [],
  );
  const onSubmit = ({ value }: { value: z.infer<typeof schema> }) => {
    updateRecord({
      id: record.id,
      status: value.status ?? record.status,
      finishedAt: value.finishedAt?.toISOString() ?? undefined,
      startedAt: value.startedAt?.toISOString() ?? undefined,
      judgment: value.judgment ?? undefined,
    });
  };
  const form = useForm({
    defaultValues: {
      startedAt: record.startedAt ? new Date(record.startedAt) : null,
      finishedAt: record.finishedAt ? new Date(record.finishedAt) : null,
      judgment: record.judgment,
      status: record.status,
    },
    validators: { onChange: schema },
    onSubmit,
  });

  return (
    <div className={container}>
      {isError && (
        <FormattedAlert
          variant="error"
          title={<FormattedMessage defaultMessage="Failed to save changes" />}
          message={<FormattedMessage defaultMessage="Please try again." />}
        />
      )}
      <form.AppForm>
        <form.Form className={formContainer}>
          <form.AppField
            name="startedAt"
            children={(field) => <field.DatePicker label={<FormattedMessage defaultMessage="started" />} />}
          />
          <form.AppField
            name="finishedAt"
            children={(field) => <field.DatePicker label={<FormattedMessage defaultMessage="finished" />} />}
          />
          <form.AppField
            name="status"
            children={(field) => (
              <field.RadioGroup
                label={intl.formatMessage({ defaultMessage: 'status' })}
                options={[
                  {
                    value: 'reading',
                    label: <FormattedMessage defaultMessage="reading" />,
                  },
                  {
                    value: 'finished',
                    label: <FormattedMessage defaultMessage="finished" />,
                  },
                  {
                    value: 'planned',
                    label: <FormattedMessage defaultMessage="planned" />,
                  },
                ]}
              />
            )}
          />
          <form.AppField
            name="judgment"
            children={(field) => (
              <field.RadioGroup
                label={intl.formatMessage({ defaultMessage: 'judgment' })}
                options={[
                  {
                    value: 'accepted',
                    label: <FormattedMessage defaultMessage="accepted" />,
                  },
                  {
                    value: 'mixed',
                    label: <FormattedMessage defaultMessage="mixed" />,
                  },
                  {
                    value: 'rejected',
                    label: <FormattedMessage defaultMessage="rejected" />,
                  },
                ]}
              />
            )}
          />
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isDirty]}
            children={([canSubmit, isDirty]) => (
              <Button
                className={submitButton}
                variant="primary"
                type="submit"
                isDisabled={!isDirty || !canSubmit}
                isProcessing={isPending}
              >
                <FormattedMessage defaultMessage="Save" />
              </Button>
            )}
          />
        </form.Form>
      </form.AppForm>
    </div>
  );
}
