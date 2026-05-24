import { createContext, useContext } from 'react';

import type { Status } from '@obelus/shared/types';

type BookListContext = {
  variant: Status;
  isPublic: boolean;
};

const ctx = createContext<BookListContext>({ variant: null!, isPublic: false });

export const BookListContextProvider = ctx.Provider;

export function useBookListContext() {
  return useContext(ctx);
}
