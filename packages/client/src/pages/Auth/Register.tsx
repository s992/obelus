import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import z from 'zod';

import { useTRPC } from '../../client';
import { AuthError } from './AuthError';
import { AuthForm } from './AuthForm';
import { formContainer } from './auth.css';

export function Register() {
  const trpc = useTRPC();
  const intl = useIntl();
  const register = useMutation(trpc.auth.register.mutationOptions());

  const schema = useMemo(
    () =>
      z.object({
        userName: z.string().nonempty(intl.formatMessage({ defaultMessage: 'username is required' })),
        password: z
          .string()
          .min(8, intl.formatMessage({ defaultMessage: 'password must be at least eight characters' })),
      }),
    [intl],
  );

  return (
    <div className={formContainer}>
      {register.isError && (
        <AuthError code={register.error.data?.code ?? ''} attemptedUserName={register.variables.userName} />
      )}
      <AuthForm
        submitLabel={<FormattedMessage defaultMessage="Register" />}
        schema={schema}
        isLoading={register.isPending}
        onSubmit={({ value }) => register.mutate(value)}
      />
    </div>
  );
}
