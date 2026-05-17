import z from 'zod';

export const SortFieldSchema = z.enum(['started_at', 'finished_at', 'last_activity']);
