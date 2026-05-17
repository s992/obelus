import { authRouter } from './auth/authRouter';
import { bookRouter } from './book/bookRouter';
import { importRouter } from './import/importRouter';
import { noteRouter } from './note/noteRouter';
import { recordRouter } from './record/recordRouter';
import { router } from './trpc/trpc';
import { userRouter } from './user/userRouter';

export const appRouter = router({
  auth: authRouter,
  book: bookRouter,
  import: importRouter,
  note: noteRouter,
  record: recordRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
