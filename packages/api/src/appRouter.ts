import {
  authRouter,
  bookRouter,
  importRouter,
  noteRouter,
  publicRecordRouter,
  recordRouter,
  userRouter,
} from './routers';
import { router } from './trpc/trpc';

export const appRouter = router({
  auth: authRouter,
  book: bookRouter,
  import: importRouter,
  note: noteRouter,
  publicRecord: publicRecordRouter,
  record: recordRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
