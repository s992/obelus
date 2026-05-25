import z from 'zod';

import { ObelusConfigSchema } from '@obelus/shared/schema';

import { db } from '../db/db';
import { RegistrationStrategySchema } from '../schema';
import { getConfig, updateConfig } from '../sqlc/config_sql';
import { adminProcedure, router } from '../trpc/trpc';

export const configRouter = router({
  get: adminProcedure.query(async () => {
    const config = await getConfig(db);

    return ObelusConfigSchema.parse(config);
  }),
  update: adminProcedure
    .input(z.object({ registrationStrategy: RegistrationStrategySchema }))
    .mutation(async ({ ctx, input }) => {
      await updateConfig(db, { registrationstrategy: input.registrationStrategy, userid: ctx.currentUser.id });
    }),
});
