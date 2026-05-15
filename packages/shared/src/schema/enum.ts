import z from 'zod';

export const JudgmentEnumSchema = z.enum(['accepted', 'rejected', 'mixed']);

export const RecordStatusEnumSchema = z.enum(['planned', 'reading', 'finished']);
