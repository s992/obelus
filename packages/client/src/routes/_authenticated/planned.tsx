import { createFileRoute } from '@tanstack/react-router';

import { Planned } from '../../pages/Planned';

export const Route = createFileRoute('/_authenticated/planned')({
  component: Planned,
});
