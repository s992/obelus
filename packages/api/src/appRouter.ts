import { authRouter } from './auth/authRouter';
import { router } from './trpc/trpc';
import { userRouter } from './user/userRouter';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
