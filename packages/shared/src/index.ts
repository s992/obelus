import { z } from "zod";

export const judgmentSchema = z.enum(["Accepted", "Rejected"]);

export const privacySchema = z.enum(["private", "public"]);

export const readingEntrySchema = z.object({
  id: z.string().uuid(),
  bookKey: z.string(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  progressPercent: z.number().min(0).max(100).nullable(),
  judgment: judgmentSchema.nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const toReadEntrySchema = z.object({
  id: z.string().uuid(),
  bookKey: z.string(),
  addedAt: z.string(),
  priority: z.number().int().min(1).max(5).nullable(),
  notes: z.string().nullable(),
});

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1),
  collectionVisibility: privacySchema,
  createdAt: z.string(),
});

export const bookSearchResultSchema = z.object({
  key: z.string(),
  title: z.string(),
  authorName: z.array(z.string()).default([]),
  firstPublishYear: z.number().nullable(),
  coverId: z.number().nullable(),
  series: z.array(z.string()).default([]),
});

export const bookDetailSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  authors: z.array(z.string()),
  publishDate: z.string().nullable(),
  covers: z.array(z.number()),
  seriesName: z.string().nullable(),
  seriesPosition: z.number().nullable(),
  seriesBooks: z
    .array(
      z.object({
        key: z.string(),
        title: z.string(),
        position: z.number().nullable(),
      }),
    )
    .default([]),
});

export const reportPointSchema = z.object({
  month: z.string(),
  finishedBooks: z.number(),
  startedBooks: z.number(),
  pagesEstimate: z.number(),
});

export const dashboardReportSchema = z.object({
  totalRead: z.number(),
  inProgress: z.number(),
  toRead: z.number(),
  accepted: z.number(),
  rejected: z.number(),
  monthly: z.array(reportPointSchema),
});

export const upsertReadingEntryInputSchema = z.object({
  bookKey: z.string().min(1),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  progressPercent: z.number().min(0).max(100).nullable(),
  judgment: judgmentSchema.nullable(),
  notes: z.string().max(4000).nullable(),
});

export const addToReadInputSchema = z.object({
  bookKey: z.string().min(1),
  priority: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const updateProfileInputSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  collectionVisibility: privacySchema.optional(),
});

export type Judgment = z.infer<typeof judgmentSchema>;
export type CollectionVisibility = z.infer<typeof privacySchema>;
export type ReadingEntry = z.infer<typeof readingEntrySchema>;
export type ToReadEntry = z.infer<typeof toReadEntrySchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type BookSearchResult = z.infer<typeof bookSearchResultSchema>;
export type BookDetail = z.infer<typeof bookDetailSchema>;
export type DashboardReport = z.infer<typeof dashboardReportSchema>;
export type UpsertReadingEntryInput = z.infer<typeof upsertReadingEntryInputSchema>;
export type AddToReadInput = z.infer<typeof addToReadInputSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
