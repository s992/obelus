import { createFileRoute } from '@tanstack/react-router';

import { Register } from '../../pages/Auth';

export const Route = createFileRoute('/auth/register')({ component: Register });
