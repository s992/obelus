import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, useParams } from '@tanstack/react-router';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import z from 'zod';

import { useTRPC } from '@/client';
import { FormattedAlert } from '@/components/Alert';
import { useAuthContext } from '@/context';

import { formContainer } from './auth.css';
import { AuthError } from './AuthError';
import { AuthForm } from './AuthForm';

export function Register() {
  const { token } = useParams({ from: '/_layout/auth/register/{-$token}' });
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

  if (register.isSuccess && register.data && register.data.status === 'pending_approval') {
    return (
      <FormattedAlert
        variant="success"
        title={<FormattedMessage defaultMessage="Registration successful." />}
        message={
          <FormattedMessage defaultMessage="Your Obelus administrator requires approval for new accounts, so they will need to approve your registration before you can use Obelus." />
        }
      />
    );
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
        onSubmit={({ value }) => register.mutate({ ...value, inviteToken: token })}
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
