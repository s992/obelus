import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { FormattedMessage } from 'react-intl';

import { useTRPC } from '../../client';
import { FormattedAlert } from '../../components/Alert';
import { BookCover } from '../../components/BookCover';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useFormatPublishYear } from '../../hooks/useFormatPublishYear';
import { typography } from '../../style';
import {
  actions,
  author,
  container,
  coverWrapper,
  description,
  header,
  loadingContainer,
  meta,
  metaRow,
  seriesLink,
  sidebar,
  title,
} from './bookDetail.css';

export function BookDetail() {
  const { bookId } = useParams({ from: '/_authenticated/book/$bookId' });
  const trpc = useTRPC();
  const { data: book, isLoading, isError } = useQuery(trpc.book.byId.queryOptions({ id: parseInt(bookId) }));
  const formatPublishDate = useFormatPublishYear();

  if (isLoading) {
    return (
      <div className={loadingContainer}>
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
        <div className={actions}>
          <Button variant="underlined">
            <FormattedMessage defaultMessage="mark read" />
          </Button>
          <Button variant="underlined">
            <FormattedMessage defaultMessage="add to planned" />
          </Button>
          <Button variant="underlined">
            <FormattedMessage defaultMessage="start reading" />
          </Button>
        </div>
      </div>
    </div>
  );
}
