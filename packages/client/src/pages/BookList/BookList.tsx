import type { Status } from '@obelus/shared/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useTRPC } from '../../client';
import { BooksTable } from '../../components/BooksTable';
import { FullPageSpinner } from '../../components/FullPageSpinner';

type Columns = {
  started?: boolean;
  finished?: boolean;
  added?: boolean;
};

type Props = {
  status: Status;
  label: string;
  columns?: Columns;
  renderEmptyState: () => ReactNode;
};

export function BookList({ status, label, columns, renderEmptyState }: Props) {
  const trpc = useTRPC();
  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery(
    trpc.record.list.infiniteQueryOptions(
      { status },
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
    <BooksTable
      books={books ?? []}
      label={label}
      columns={columns}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      renderEmptyState={renderEmptyState}
    />
  );
}
