import { useMutation } from '@tanstack/react-query';
import z from 'zod';

import { useTRPC } from '../../client';
import { AuthError } from './AuthError';
import { AuthForm } from './AuthForm';
import { formContainer } from './auth.css';

const schema = z.object({
  userName: z.string().nonempty('username is required'),
  password: z.string().min(8, 'password must be at least eight characters'),
});

export function Register() {
  const trpc = useTRPC();
  const register = useMutation(trpc.auth.register.mutationOptions());

  return (
    <div className={formContainer}>
      {register.isError && (
        <AuthError code={register.error.data?.code ?? ''} attemptedUserName={register.variables.userName} />
      )}
      <AuthForm
        submitLabel="Register"
        schema={schema}
        isLoading={register.isPending}
        onSubmit={({ value }) => register.mutate(value)}
      />
    </div>
  );
}
