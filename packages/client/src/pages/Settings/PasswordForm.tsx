import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import z from 'zod';

import { Button } from '../../components/Button';
import { useForm } from '../../form';

type FormValues = { currentPassword: string; newPassword: string; confirmPassword: string };

type OnSubmitArgs = { value: FormValues };

type Props = {
  onSubmit: (args: OnSubmitArgs) => void;
  isLoading?: boolean;
};

export function PasswordForm({ onSubmit, isLoading }: Props) {
  const intl = useIntl();
  const schema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string(),
          newPassword: z
            .string()
            .min(8, intl.formatMessage({ defaultMessage: 'password must be at least eight characters' })),
          confirmPassword: z.string(),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          error: intl.formatMessage({ defaultMessage: 'passwords must match' }),
          path: ['confirmPassword'],
        }),
    [],
  );
  const form = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validators: { onChange: schema },
    onSubmit,
  });

  return (
    <form.AppForm>
      <form.Form>
        <form.AppField
          name="currentPassword"
          children={(field) => (
            <field.TextField type="password" label={<FormattedMessage defaultMessage="Current Password" />} />
          )}
        />
        <form.AppField
          name="newPassword"
          children={(field) => (
            <field.TextField type="password" label={<FormattedMessage defaultMessage="New Password" />} />
          )}
        />
        <form.AppField
          name="confirmPassword"
          children={(field) => (
            <field.TextField type="password" label={<FormattedMessage defaultMessage="Confirm New Password" />} />
          )}
        />
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isDirty]}
          children={([canSubmit, isDirty]) => (
            <Button variant="primary" type="submit" isDisabled={!isDirty || !canSubmit} isProcessing={isLoading}>
              <FormattedMessage defaultMessage="Submit" />
            </Button>
          )}
        />
      </form.Form>
    </form.AppForm>
  );
}
