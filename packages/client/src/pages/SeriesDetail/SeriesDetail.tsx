import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import clsx from 'clsx';
import { GridList, GridListItem } from 'react-aria-components';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '../../client';
import { BookCover } from '../../components/BookCover';
import { FullPageSpinner } from '../../components/FullPageSpinner';
import { Link } from '../../components/Link';
import { LoadError } from '../../components/LoadError';
import { TitleAuthorStack } from '../../components/TitleAuthorStack';
import { StatusCell } from '../../features/StatusCell';
import { useFormatPublishYear } from '../../hooks/useFormatPublishYear';
import { flex, typography } from '../../style';
import {
  gridCell,
  gridRow,
  header,
  pageContainer,
  position,
  publishDate,
  smallCell,
  statusCell,
} from './seriesDetail.css';

export function SeriesDetail() {
  const { seriesId } = useParams({ from: '/_authenticated/series/$seriesId' });
  const intl = useIntl();
  const trpc = useTRPC();
  const formatPublishYear = useFormatPublishYear();
  const {
    data: series,
    isLoading,
    isError: isLoadError,
  } = useQuery(trpc.book.seriesById.queryOptions({ id: parseInt(seriesId) }));

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isLoadError || !series) {
    return <LoadError title={<FormattedMessage defaultMessage="Failed to load series." />} />;
  }

  return (
    <div className={pageContainer}>
      <h1 className={typography.display}>{series.series.name}</h1>
      <div>
        <div className={header}>
          <div />
          <div />
          <div>
            <FormattedMessage defaultMessage="title · author" />
          </div>
          <div>
            <FormattedMessage defaultMessage="published" />
          </div>
          <div>
            <FormattedMessage defaultMessage="judgment" />
          </div>
        </div>
        <GridList
          aria-label={intl.formatMessage(
            { defaultMessage: 'Books from the series "{series}"' },
            { series: series.series.name },
          )}
        >
          {series.books.map((book) => {
            const publishYear = formatPublishYear(book.releaseDate);

            return (
              <GridListItem
                key={book.id}
                textValue={intl.formatMessage(
                  { defaultMessage: '{title} by {author}, published {publishYear}' },
                  { title: book.title, author: book.author, publishYear },
                )}
                className={gridRow}
              >
                <div className={clsx(position, smallCell)}>
                  <div className={flex.center}>{book.series?.position}</div>
                </div>
                <div className={smallCell}>
                  <BookCover book={book} />
                </div>
                <div className={gridCell}>
                  <Link to="/book/$bookId" params={{ bookId: book.id.toString() }}>
                    <TitleAuthorStack title={book.title} author={book.author} />
                  </Link>
                </div>
                <div className={publishDate}>{publishYear}</div>
                <div className={statusCell}>
                  <StatusCell
                    bookId={book.id}
                    seriesId={book.series?.id}
                    layout="vertical"
                    status={book.record?.status}
                    judgment={book.record?.judgment}
                  />
                </div>
              </GridListItem>
            );
          })}
        </GridList>
      </div>
    </div>
  );
}
