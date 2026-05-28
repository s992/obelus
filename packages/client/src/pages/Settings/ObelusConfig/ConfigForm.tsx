import { useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import z from 'zod';

import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { useForm } from '@/form';
import { ObelusConfigSchema } from '@obelus/shared/schema';
import type { ObelusConfig } from '@obelus/shared/types';

type FormValues = z.infer<typeof ObelusConfigSchema>;

type OnSubmitArgs = { value: FormValues };

type Props = {
  onSubmit: (args: OnSubmitArgs) => void;
  defaultValues: ObelusConfig;
  isLoading?: boolean;
};

export function ConfigForm({ onSubmit, defaultValues, isLoading }: Props) {
  const intl = useIntl();
  const form = useForm({
    defaultValues,
    validators: { onChange: ObelusConfigSchema },
    onSubmit,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);

  return (
    <form.AppForm>
      <form.Form>
        <form.AppField name="registrationStrategy">
          {(field) => (
            <field.Select label={<FormattedMessage defaultMessage="Registration Strategy" />}>
              <Select.Item id="open">{intl.formatMessage({ defaultMessage: 'open' })}</Select.Item>
              <Select.Item id="requires_approval">
                {intl.formatMessage({ defaultMessage: 'requires approval' })}
              </Select.Item>
              <Select.Item id="invite_link">{intl.formatMessage({ defaultMessage: 'invite link' })}</Select.Item>
              <Select.Item id="closed">{intl.formatMessage({ defaultMessage: 'closed' })}</Select.Item>
            </field.Select>
          )}
        </form.AppField>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isDirty]}>
          {([canSubmit, isDirty]) => (
            <Button variant="primary" type="submit" isDisabled={!isDirty || !canSubmit} isProcessing={isLoading}>
              <FormattedMessage defaultMessage="Submit" />
            </Button>
          )}
        </form.Subscribe>
      </form.Form>
    </form.AppForm>
  );
}
