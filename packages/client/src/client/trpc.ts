import type { AppRouter } from '@obelus/api';
import { createTRPCClient, httpBatchLink, httpSubscriptionLink, splitLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: httpSubscriptionLink({
        url: `${window.location.origin}/api/trpc`,
        eventSourceOptions() {
          return { withCredentials: true };
        },
      }),
      false: httpBatchLink({
        url: `${window.location.origin}/api/trpc`,
        fetch(url, options) {
          return fetch(url, { ...options, credentials: 'include' });
        },
      }),
    }),
  ],
});
