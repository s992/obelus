import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import z from 'zod';

import { useTRPC } from '../../client';
import { useAuthContext } from '../../context';
import { AuthError } from './AuthError';
import { AuthForm } from './AuthForm';
import { formContainer } from './auth.css';

export function Register() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthContext();
  const schema = useSchema();
  const register = useMutation(
    trpc.auth.register.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.user.me.queryFilter());
      },
    }),
  );

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

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

function useSchema() {
  const intl = useIntl();

  return useMemo(
    () =>
      z.object({
        userName: z.string().nonempty(intl.formatMessage({ defaultMessage: 'username is required' })),
        password: z
          .string()
          .min(8, intl.formatMessage({ defaultMessage: 'password must be at least eight characters' })),
      }),
    [intl],
  );
}
