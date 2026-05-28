import { randomBytes } from 'node:crypto';
import z from 'zod';

import { InviteLinkStatusSchema, ListInviteLinksSchema } from '@obelus/shared/schema';

import { db } from '../db/db';
import { listInviteLinks, PAGE_SIZE } from '../inviteLink/listInviteLinks';
import { createInviteLink, invalidateInviteLink } from '../sqlc/invite_link_sql';
import { adminProcedure, router } from '../trpc/trpc';

export const inviteLinkRouter = router({
  list: adminProcedure
    .input(
      z.object({
        status: InviteLinkStatusSchema.nullable(),
        cursor: z.string().optional(),
      }),
    )
    .output(ListInviteLinksSchema)
    .query(async ({ input }) => {
      const result = await listInviteLinks(input.cursor, input.status);

      return ListInviteLinksSchema.parse({ ...result, pageSize: PAGE_SIZE });
    }),
  create: adminProcedure.mutation(async ({ ctx }) => {
    const token = Date.now().toString(36) + randomBytes(3).toString('base64url');
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 3);

    await createInviteLink(db, { token, expiresat: expiry, createdby: ctx.currentUser.id });
  }),
  invalidate: adminProcedure.input(z.object({ id: z.uuidv4() })).mutation(async ({ input }) => {
    await invalidateInviteLink(db, { id: input.id });
  }),
});
