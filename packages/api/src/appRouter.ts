import {
  authRouter,
  bookRouter,
  configRouter,
  importRouter,
  inviteLinkRouter,
  noteRouter,
  publicRecordRouter,
  recordRouter,
  userRouter,
} from './routers';
import { router } from './trpc/trpc';

export const appRouter = router({
  auth: authRouter,
  book: bookRouter,
  config: configRouter,
  import: importRouter,
  inviteLinks: inviteLinkRouter,
  note: noteRouter,
  publicRecord: publicRecordRouter,
  record: recordRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
