import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { FormattedMessage } from 'react-intl';

import { useTRPC } from '../../client';
import { FormattedAlert } from '../../components/Alert';
import { BookCover } from '../../components/BookCover';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusCell } from '../../features/StatusCell';
import { useFormatLongDate } from '../../hooks/useFormatLongDate';
import { useFormatPublishYear } from '../../hooks/useFormatPublishYear';
import { flex, typography } from '../../style';
import {
  actions,
  author,
  container,
  coverWrapper,
  description,
  header,
  meta,
  metaRow,
  seriesLink,
  sidebar,
  title,
} from './bookDetail.css';
import { RecordContent } from './RecordContent';

export function BookDetail() {
  const { bookId } = useParams({ from: '/_authenticated/book/$bookId' });
  const trpc = useTRPC();
  const { data: book, isLoading, isError } = useQuery(trpc.book.byId.queryOptions({ id: parseInt(bookId) }));
  const formatPublishDate = useFormatPublishYear();
  const formatLongDate = useFormatLongDate();

  if (isLoading) {
    return (
      <div className={flex.center}>
        <LoadingSpinner size="xlarge" />
      </div>
    );
  }

  if (isError || !book) {
    return (
      <FormattedAlert
        variant="error"
        title={<FormattedMessage defaultMessage="Failed to load book." />}
        message={<FormattedMessage defaultMessage="Please refresh your browser window to try again." />}
      />
    );
  }

  return (
    <div className={container}>
      <div className={sidebar}>
        <div className={coverWrapper}>
          <BookCover book={book} size="xlarge" />
        </div>
        <dl className={meta}>
          {book.record && (
            <>
              <div className={metaRow}>
                <dt className={typography.label}>
                  <FormattedMessage defaultMessage="first entered" />
                </dt>
                <dd className={typography.metaItalic}>{formatLongDate(book.record.createdAt)}</dd>
              </div>
              <div className={metaRow}>
                <dt className={typography.label}>
                  <FormattedMessage defaultMessage="last touched" />
                </dt>
                <dd className={typography.metaItalic}>{formatLongDate(book.record.updatedAt)}</dd>
              </div>
            </>
          )}
          <div className={metaRow}>
            <dt className={typography.label}>
              <FormattedMessage defaultMessage="published" />
            </dt>
            <dd className={typography.metaItalic}>{formatPublishDate(book.releaseDate)}</dd>
          </div>
          <div className={metaRow}>
            <dt className={typography.label}>
              <FormattedMessage defaultMessage="pages" />
            </dt>
            <dd className={typography.metaItalic}>{book.pages}</dd>
          </div>
        </dl>
      </div>
      <div>
        <div className={header}>
          <h1 className={title}>{book.title}</h1>
          <p className={author}>{book.author}</p>
          {book.series && (
            <Link to="/series/$seriesId" params={{ seriesId: book.series.id?.toString() ?? '' }} className={seriesLink}>
              <FormattedMessage
                defaultMessage="{name}: {position} of {total}"
                values={{ name: book.series.name, position: book.series.position, total: book.series.bookCount }}
              />
            </Link>
          )}
        </div>
        <pre className={description}>{book.description}</pre>
        {book.record ? (
          <RecordContent book={book} />
        ) : (
          <div className={actions}>
            <StatusCell bookId={book.id} seriesId={book.series?.id} layout="horizontal" />
          </div>
        )}
      </div>
    </div>
  );
}
