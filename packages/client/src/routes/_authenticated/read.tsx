import { createFileRoute } from '@tanstack/react-router';

import { Read } from '../../pages/Read';

export const Route = createFileRoute('/_authenticated/read')({
  component: Read,
});
