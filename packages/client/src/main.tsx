import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { routeTree } from './routeTree.gen';
import './style/reset.css';
import './style/react-aria-modal.css';
import { QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { IntlProvider } from 'react-intl';

import { getQueryClient, TRPCProvider, trpcClient } from './client';
import { AuthContextProvider, useAuthContext } from './context';
import { NotFound } from './pages/NotFound';

dayjs.extend(customParseFormat);

const router = createRouter({ routeTree, context: { auth: undefined! }, defaultNotFoundComponent: NotFound });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  const auth = useAuthContext();

  useEffect(() => {
    router.invalidate();
  }, [auth.isAuthenticated]);

  return <RouterProvider router={router} context={{ auth }} />;
}

function App() {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <IntlProvider locale="en-US" onError={() => {}}>
          <AuthContextProvider>
            <InnerApp />
          </AuthContextProvider>
        </IntlProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}

const rootElement = document.getElementById('root')!;

if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
