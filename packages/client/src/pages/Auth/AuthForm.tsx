import { type ReactNode, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { Button } from '../../components/Button';
import { useForm } from '../../form';

type FormValues = { userName: string; password: string };

type OnSubmitArgs = {
  value: FormValues;
};

type Props = {
  isLoading: boolean;
  onSubmit: (args: OnSubmitArgs) => void | Promise<void>;
  schema?: z.ZodObject<{ userName: z.ZodString; password: z.ZodString }>;
  submitLabel: ReactNode;
};

export function AuthForm({ isLoading, onSubmit, schema, submitLabel }: Props) {
  const intl = useIntl();
  const resolvedSchema = useMemo(
    () =>
      schema ??
      z.object({
        userName: z
          .string()
          .trim()
          .nonempty(intl.formatMessage({ defaultMessage: 'username is required' })),
        password: z.string().nonempty(intl.formatMessage({ defaultMessage: 'password is required' })),
      }),
    [schema, intl],
  );
  const form = useForm({
    defaultValues: { userName: '', password: '' },
    validators: { onChange: resolvedSchema },
    onSubmit,
  });

  return (
    <form.AppForm>
      <form.Form>
        <form.AppField
          name="userName"
          children={(field) => <field.TextField label={<FormattedMessage defaultMessage="user name" />} />}
        />
        <form.AppField
          name="password"
          children={(field) => (
            <field.TextField label={<FormattedMessage defaultMessage="password" />} type="password" />
          )}
        />
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isDirty]}
          children={([canSubmit, isDirty]) => (
            <Button variant="primary" type="submit" isDisabled={!isDirty || !canSubmit} isProcessing={isLoading}>
              {submitLabel}
            </Button>
          )}
        />
      </form.Form>
    </form.AppForm>
  );
}
