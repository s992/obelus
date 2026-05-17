import type { SortField, Status } from '@obelus/shared/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useTRPC } from '../../client';
import { BooksTable } from '../../components/BooksTable';
import { FullPageSpinner } from '../../components/FullPageSpinner';
import { BookListContextProvider } from './context';

type Columns = {
  started?: boolean;
  finished?: boolean;
  added?: boolean;
};

type Props = {
  status: Status;
  label: string;
  sortField: SortField;
  columns?: Columns;
  renderEmptyState: () => ReactNode;
};

export function BookList({ status, label, sortField, columns, renderEmptyState }: Props) {
  const trpc = useTRPC();
  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery(
    trpc.record.list.infiniteQueryOptions(
      { status, sortField },
      {
        getNextPageParam: (data) => data?.nextPageToken,
      },
    ),
  );
  const books = data?.pages.flatMap((page) => page?.books).filter((book) => book !== undefined);

  if (isLoading) {
    return <FullPageSpinner />;
  }

  return (
    <BookListContextProvider value={{ queryKey: trpc.record.list.infiniteQueryKey({ status, sortField }) }}>
      <BooksTable
        books={books ?? []}
        label={label}
        columns={columns}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        renderEmptyState={renderEmptyState}
      />
    </BookListContextProvider>
  );
}
