import { createFileRoute, redirect } from '@tanstack/react-router';

function Index() {
  return <>dont look at me</>;
}

export const Route = createFileRoute('/')({
  component: Index,
  beforeLoad: async ({ location }) => {
    if (true) {
      throw redirect({
        to: '/auth/login',
      });
    }
  },
});
