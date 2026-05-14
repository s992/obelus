import { authRouter } from './auth/authRouter';
import { bookRouter } from './book/bookRouter';
import { noteRouter } from './note/noteRouter';
import { recordRouter } from './record/recordRouter';
import { router } from './trpc/trpc';
import { userRouter } from './user/userRouter';

export const appRouter = router({
  auth: authRouter,
  book: bookRouter,
  note: noteRouter,
  record: recordRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
