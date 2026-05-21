import type { QueryKey } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

type ListPageContext = {
  queryKey: QueryKey;
  hasNextPage: boolean;
  fetchNextPage: () => void;
};

const ctx = createContext<ListPageContext>({ queryKey: null!, hasNextPage: null!, fetchNextPage: null! });

export const ListPageContextProvider = ctx.Provider;

export function useListPageContext() {
  return useContext(ctx);
}
