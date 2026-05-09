import type { AppRouter } from '@obelus/api';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, useNavigate } from '@tanstack/react-router';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { RouterProvider } from 'react-aria-components';
import { IntlProvider } from 'react-intl';

import { getQueryClient } from '../client';
import { TRPCProvider } from '../client/trpc';
import { Root } from '../pages/Root/Root';

function RootComponent() {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: 'http://localhost:3000/trpc' })],
    }),
  );
  const navigate = useNavigate();

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <IntlProvider locale="en-US">
          <RouterProvider navigate={(path, opts) => navigate({ to: path, ...(opts as any) })}>
            <Root />
          </RouterProvider>
        </IntlProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}

export const Route = createRootRoute({ component: RootComponent });
