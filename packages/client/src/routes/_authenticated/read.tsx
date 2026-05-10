import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/read')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_authenticated/read"!</div>;
}
