import { z } from 'zod';

import type {
  BookSchema,
  ImportProgressSchema,
  InviteLinkStatusSchema,
  NoteJsonSchema,
  NoteSchema,
  ObelusConfigSchema,
  RecordJsonSchema,
  RecordSchema,
  SeriesSchema,
  RecordSortFieldSchema,
  UserRoleSchema,
  UserStatusSchema,
} from '../schema';

export type Book = z.infer<typeof BookSchema>;

export type Series = z.infer<typeof SeriesSchema>;

export type Note = z.infer<typeof NoteSchema>;

export type NoteJson = z.infer<typeof NoteJsonSchema>;

export type Record = z.infer<typeof RecordSchema>;

export type RecordJson = z.infer<typeof RecordJsonSchema>;

export type RecordSortField = z.infer<typeof RecordSortFieldSchema>;

export type ImportProgress = z.infer<typeof ImportProgressSchema>;

export type UserStatus = z.infer<typeof UserStatusSchema>;

export type UserRole = z.infer<typeof UserRoleSchema>;

export type ObelusConfig = z.infer<typeof ObelusConfigSchema>;

export type InviteLinkStatus = z.infer<typeof InviteLinkStatusSchema>;

export type Status = 'planned' | 'finished' | 'reading';

export type Judgment = 'accepted' | 'rejected' | 'mixed';

export type Maybe<T> = T | undefined | null;
