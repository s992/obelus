import { z } from 'zod';

import { Button } from '../../components/Button';
import { useForm } from '../../form';

const baseSchema = z.object({
  userName: z.string().trim().nonempty('username is required'),
  password: z.string().nonempty('password is required'),
});

type OnSubmitArgs = {
  value: z.infer<typeof baseSchema>;
};

type Props = {
  isLoading: boolean;
  onSubmit: (args: OnSubmitArgs) => void | Promise<void>;
  schema?: typeof baseSchema;
  submitLabel: string;
};

export function AuthForm({ isLoading, onSubmit, schema = baseSchema, submitLabel }: Props) {
  const form = useForm({
    defaultValues: { userName: '', password: '' },
    validators: { onChange: schema },
    onSubmit,
  });

  return (
    <form.AppForm>
      <form.Form>
        <form.AppField name="userName" children={(field) => <field.TextField label="user name" />} />
        <form.AppField name="password" children={(field) => <field.TextField label="password" type="password" />} />
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
