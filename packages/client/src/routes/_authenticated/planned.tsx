import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/planned')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_authenticated/planned"!</div>;
}
