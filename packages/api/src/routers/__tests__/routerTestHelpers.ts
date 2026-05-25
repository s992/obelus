import { initTRPC } from '@trpc/server';
import { randomUUID } from 'node:crypto';

import type { Context } from '../../trpc/context';

const t = initTRPC.context<Context>().create();

export const createCallerFactory = t.createCallerFactory;

type CallerFn<T> = (opts: Context) => T;

export function makeCallerHelpers<T>(createCaller: CallerFn<T>) {
  function authedCaller(userId = randomUUID()) {
    return createCaller({
      req: {} as Context['req'],
      res: {} as Context['res'],
      currentUser: { isAuthenticated: true, id: userId, role: 'member' },
    });
  }

  function unauthenticatedCaller() {
    return createCaller({
      req: {} as Context['req'],
      res: {} as Context['res'],
      currentUser: { isAuthenticated: false },
    });
  }

  return { authedCaller, unauthenticatedCaller };
}
