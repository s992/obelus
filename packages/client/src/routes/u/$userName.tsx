import { createFileRoute } from '@tanstack/react-router';

import { PublicRecord } from '@/pages/PublicRecord';

export const Route = createFileRoute('/u/$userName')({
  component: PublicRecord,
});
