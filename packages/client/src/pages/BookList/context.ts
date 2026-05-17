import type { QueryKey } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

type BookListContext = {
  queryKey: QueryKey;
};

const ctx = createContext<BookListContext>({ queryKey: null! });

export const BookListContextProvider = ctx.Provider;

export function useBookListContext() {
  return useContext(ctx);
}
