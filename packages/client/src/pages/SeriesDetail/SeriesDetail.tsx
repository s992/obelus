import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { FormattedMessage } from 'react-intl';

import { useTRPC } from '@/client';
import { ListGroupRow } from '@/components/BookList/ListGroup/ListGroupRow';
import { ListHeader } from '@/components/BookList/ListHeader';
import { FullContainerSpinner } from '@/components/FullContainerSpinner';
import { LoadError } from '@/components/LoadError';
import { ListPageContextProvider } from '@/pages/ListPage/context';

import { bookItem, position, row } from './seriesDetail.css';

export function SeriesDetail() {
  const { seriesId } = useParams({ from: '/_layout/_authenticated/series/$seriesId' });
  const trpc = useTRPC();
  const {
    data: series,
    isLoading,
    isError: isLoadError,
  } = useQuery(trpc.book.seriesById.queryOptions({ id: parseInt(seriesId) }));

  if (isLoading) {
    return <FullContainerSpinner />;
  }

  if (isLoadError || !series) {
    return <LoadError title={<FormattedMessage defaultMessage="Failed to load series." />} />;
  }

  return (
    <>
      <ListHeader title={series.series.name} count={series.series.bookCount ?? 0} />
      <ListPageContextProvider
        value={{ fetchNextPage: () => {}, hasNextPage: false, queryKey: trpc.book.seriesById.queryKey() }}
      >
        {series.books.map((book) => (
          <div key={book.id} className={row}>
            <div className={position}>{book.series?.position}</div>
            <ListGroupRow book={book} variant={book.record?.status ?? 'untracked'} className={bookItem} />
          </div>
        ))}
      </ListPageContextProvider>
    </>
  );
}
