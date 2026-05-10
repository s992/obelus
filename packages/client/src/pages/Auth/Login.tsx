import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate } from '@tanstack/react-router';
import { FormattedMessage } from 'react-intl';

import { useTRPC } from '../../client';
import { useAuthContext } from '../../context';
import { AuthError } from './AuthError';
import { AuthForm } from './AuthForm';
import { formContainer } from './auth.css';

export function Login() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthContext();
  const login = useMutation(
    trpc.auth.login.mutationOptions({
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
      {login.isError && <AuthError code={login.error.data?.code ?? ''} attemptedUserName={login.variables.userName} />}
      <AuthForm
        submitLabel={<FormattedMessage defaultMessage="Sign In" />}
        isLoading={login.isPending}
        onSubmit={({ value }) => login.mutate(value)}
      />
    </div>
  );
}
