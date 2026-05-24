import { createFileRoute } from '@tanstack/react-router';

import { Root } from '@/pages/Root';

export const Route = createFileRoute('/_layout')({
  component: Root,
});
