import z from 'zod';

export const InviteLinkSchema = z.object({
  id: z.uuidv4(),
  token: z.string(),
  expiresAt: z.date(),
  usedAt: z.date().nullable(),
  usedBy: z.string().nullable(),
  userName: z.string().nullable(),
});

export const InviteLinkJsonSchema = InviteLinkSchema.omit({ expiresAt: true, usedAt: true }).extend({
  expiresAt: z.iso.datetime(),
  usedAt: z.iso.datetime().nullable(),
});

export const InviteLinkStatusSchema = z.enum(['active', 'used', 'invalidated']);

export const ListInviteLinksSchema = z.object({
  links: z.array(InviteLinkSchema),
  hasNextPage: z.boolean(),
  nextPageToken: z.string().nullable(),
  totalCount: z.number(),
  pageSize: z.number(),
});
