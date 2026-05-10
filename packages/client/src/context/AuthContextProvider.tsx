import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext, useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { useTRPC } from '../client';

export type AuthContext = {
  isAuthenticated: boolean;
  logout: () => Promise<void>;
};

const ctx = createContext<AuthContext>({ isAuthenticated: false, logout: undefined! });

export function useAuthContext() {
  return useContext(ctx);
}

type Props = {
  children: ReactNode;
};

export function AuthContextProvider({ children }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isAuthenticatedLS, setIsAuthenticatedLS, removeIsAuthenticatedLS] = useLocalStorage('isAuthenticated', false);
  const logout = useMutation(
    trpc.auth.logout.mutationOptions({
      onSuccess: async () => {
        removeIsAuthenticatedLS();
        await queryClient.invalidateQueries(trpc.user.me.queryFilter());
      },
    }),
  );
  const { isError: isLoggedOut } = useQuery(trpc.user.me.queryOptions(undefined, { retry: false }));

  useEffect(() => {
    if (isLoggedOut) {
      removeIsAuthenticatedLS();
    } else {
      setIsAuthenticatedLS(true);
    }
  }, [isLoggedOut]);

  return (
    <ctx.Provider
      value={{
        isAuthenticated: isAuthenticatedLS,
        logout: logout.mutateAsync,
      }}
    >
      {children}
    </ctx.Provider>
  );
}
