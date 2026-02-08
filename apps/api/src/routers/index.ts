import { router } from "../lib/trpc.js";
import { authRouter } from "./auth.js";
import { booksRouter } from "./books.js";
import { libraryRouter } from "./library.js";
import { reportsRouter } from "./reports.js";

export const appRouter = router({
  auth: authRouter,
  books: booksRouter,
  library: libraryRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
