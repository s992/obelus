import { useInfiniteQuery } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

import { useTRPC } from '@/client';
import { BookList } from '@/components/BookList';
import type { Judgment, RecordSortField, Status } from '@obelus/shared/types';

import { ListPageContextProvider } from './context';

type Props = {
  status: Status;
  sortField: RecordSortField;
  renderEmptyState: () => ReactNode;
};

export function ListPage({ status, sortField, renderEmptyState }: Props) {
  const trpc = useTRPC();
  const [judgmentFilter, setJudgmentFilter] = useState<Judgment | null>(null);
  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery(
    trpc.record.list.infiniteQueryOptions(
      { status, judgment: judgmentFilter, sortField },
      {
        getNextPageParam: (data) => data?.nextPageToken,
      },
    ),
  );
  const books = data?.pages.flatMap((page) => page?.books).filter((book) => book !== undefined);

  return (
    <ListPageContextProvider value={{ queryKey: trpc.record.list.infiniteQueryKey(), hasNextPage, fetchNextPage }}>
      <BookList
        books={books ?? []}
        variant={status}
        totalCount={data?.pages?.[0]?.totalCount ?? 0}
        renderEmptyState={renderEmptyState}
        filter={judgmentFilter}
        onFilterChanged={setJudgmentFilter}
        isLoading={isLoading}
      />
    </ListPageContextProvider>
  );
}
