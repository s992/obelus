import { createFileRoute } from '@tanstack/react-router';

import { Register } from '@/pages/Auth';

export const Route = createFileRoute('/_layout/auth/register/{-$token}')({ component: Register });
