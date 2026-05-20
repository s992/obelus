import { authRouter } from './auth/authRouter';
import { bookRouter } from './book/bookRouter';
import { importRouter } from './import/importRouter';
import { noteRouter } from './note/noteRouter';
import { publicRecordRouter } from './publicRecord/publicRecordRouter';
import { recordRouter } from './record/recordRouter';
import { router } from './trpc/trpc';
import { userRouter } from './user/userRouter';

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
