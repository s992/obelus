import { randomBytes } from 'node:crypto';
import z from 'zod';

import { InviteLinkStatusSchema, ListInviteLinksSchema } from '@obelus/shared/schema';

import { db } from '../db/db';
import { paginate } from '../pagination/paginate';
import { createInviteLink, invalidateInviteLink, listInviteLinks } from '../sqlc/invite_link_sql';
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
      const { records, ...rest } = await paginate({
        queryFn: ({ cursor, pageSize }) =>
          listInviteLinks(db, {
            cursor: cursor ? new Date(cursor) : null,
            status: input.status ?? null,
            pagesize: pageSize,
          }),
        currentCursor: input.cursor,
        getCount: (row) => parseInt(row.totalCount),
        getNextCursor: (row) => row.expiresAt.toISOString(),
        pageSize: 25,
      });

      return ListInviteLinksSchema.parse({ links: records, ...rest });
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
