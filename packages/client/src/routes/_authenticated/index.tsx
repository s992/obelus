import { createFileRoute } from '@tanstack/react-router';

import { CurrentlyReading } from '../../pages/CurrentlyReading';

export const Route = createFileRoute('/_authenticated/')({
  component: CurrentlyReading,
});
