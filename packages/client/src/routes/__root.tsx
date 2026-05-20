import { createRootRouteWithContext, Outlet, useNavigate } from '@tanstack/react-router';
import { RouterProvider } from 'react-aria-components';

import { type AuthContext, ThemeContextProvider } from '../context';
import { container, pageWrapper } from '../style/page.css';

type RouterContext = {
  auth: AuthContext;
};

function RootComponent() {
  const navigate = useNavigate();

  return (
    <RouterProvider navigate={(path, opts) => navigate({ to: path, ...(opts as any) })}>
      <ThemeContextProvider>
        <div className={pageWrapper}>
          <div className={container}>
            <Outlet />
          </div>
        </div>
      </ThemeContextProvider>
    </RouterProvider>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({ component: RootComponent });
