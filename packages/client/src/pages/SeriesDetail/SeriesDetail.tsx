import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { GridList, GridListItem } from 'react-aria-components';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '../../client';
import { FormattedAlert } from '../../components/Alert';
import { BookCover } from '../../components/BookCover';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { TitleAuthorStack } from '../../components/TitleAuthorStack';
import { StatusCell } from '../../features/StatusCell';
import { useFormatPublishYear } from '../../hooks/useFormatPublishYear';
import { flex, typography } from '../../style';
import { gridRow, header, link, pageContainer, position, smallCell } from './seriesDetail.css';

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
    return (
      <div className={flex.center}>
        <LoadingSpinner size="xlarge" />
      </div>
    );
  }

  if (isLoadError || !series) {
    return (
      <FormattedAlert
        variant="error"
        title={<FormattedMessage defaultMessage="Failed to load series." />}
        message={<FormattedMessage defaultMessage="Please refresh your browser window to try again." />}
      />
    );
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
                <div className={`${position} ${smallCell}`}>
                  <div className={flex.center}>{book.series?.position}</div>
                </div>
                <div className={smallCell}>
                  <BookCover book={book} />
                </div>
                <div className={flex.verticalCenter}>
                  <Link className={link} to="/book/$bookId" params={{ bookId: book.id.toString() }}>
                    <TitleAuthorStack title={book.title} author={book.author} />
                  </Link>
                </div>
                <div className={flex.verticalCenter}>{publishYear}</div>
                <div className={flex.verticalCenter}>
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
