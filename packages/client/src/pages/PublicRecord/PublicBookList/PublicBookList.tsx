import { useInfiniteQuery } from '@tanstack/react-query';
import { FormattedMessage } from 'react-intl';

import { useTRPC } from '@/client';
import { BookList } from '@/components/BookList';
import { FullContainerSpinner } from '@/components/FullContainerSpinner';
import { ListPageContextProvider } from '@/pages/ListPage/context';
import type { RecordSortField, Status } from '@obelus/shared/types';

type Props = {
  userName: string;
  status: Status;
  sortField: RecordSortField;
};

export function PublicBookList({ userName, status, sortField }: Props) {
  const trpc = useTRPC();
  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery(
    trpc.publicRecord.records.infiniteQueryOptions(
      { userName, status, sortField },
      {
        getNextPageParam: (data) => data?.nextPageToken,
      },
    ),
  );
  const books = data?.pages.flatMap((page) => page?.books).filter((book) => book !== undefined);

  if (isLoading) {
    return <FullContainerSpinner />;
  }

  return (
    <ListPageContextProvider value={{ queryKey: trpc.record.list.infiniteQueryKey(), hasNextPage, fetchNextPage }}>
      <BookList
        books={books ?? []}
        variant={status}
        totalCount={data?.pages?.[0]?.totalCount ?? 0}
        renderEmptyState={() => <FormattedMessage defaultMessage="No records found." />}
        isPublic
      />
    </ListPageContextProvider>
  );
}
