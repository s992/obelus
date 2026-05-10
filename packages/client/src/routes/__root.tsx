import { createRootRouteWithContext, useNavigate } from '@tanstack/react-router';
import { RouterProvider } from 'react-aria-components';

import { type AuthContext } from '../context';
import { Root } from '../pages/Root/Root';

type RouterContext = {
  auth: AuthContext;
};

function RootComponent() {
  const navigate = useNavigate();

  return (
    <RouterProvider navigate={(path, opts) => navigate({ to: path, ...(opts as any) })}>
      <Root />
    </RouterProvider>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({ component: RootComponent });
