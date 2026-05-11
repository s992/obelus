import type { Book } from '@obelus/shared/types';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '../../client';
import { Alert } from '../../components/Alert';
import { BookCover } from '../../components/BookCover';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { typography } from '../../style';
import {
  actions,
  alertBody,
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
  const intl = useIntl();
  const trpc = useTRPC();
  const { data, isLoading, isError } = useQuery(trpc.book.byId.queryOptions({ id: parseInt(bookId) }));
  // TODO: figure out why i have to cast this
  const book = data as Book;

  if (isLoading) {
    return (
      <div className={loadingContainer}>
        <LoadingSpinner size="xlarge" />
      </div>
    );
  }

  if (isError || !book) {
    return (
      <Alert variant="error">
        <strong>
          <FormattedMessage defaultMessage="Failed to load book." />
        </strong>
        <p className={alertBody}>
          <FormattedMessage defaultMessage="Please refresh your browser window to try again." />
        </p>
      </Alert>
    );
  }

  const publishDate = dayjs(book.releaseDate, 'YYYY-MM-DD');
  const formattedPublishDate = publishDate.isValid()
    ? publishDate.format('YYYY')
    : intl.formatMessage({ defaultMessage: 'N/A' });

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
            <dd className={typography.metaItalic}>{formattedPublishDate}</dd>
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
            <Link to="/" className={seriesLink}>
              <FormattedMessage
                defaultMessage="{name}: {position} of {total}"
                values={{ name: book.series.name, position: book.series.position, total: book.series.bookCount }}
              />
            </Link>
          )}
        </div>
        <pre className={description}>{book.description}</pre>
        <div className={actions}>
          <Button variant="secondary">
            <FormattedMessage defaultMessage="Mark read" />
          </Button>
          <Button variant="secondary">
            <FormattedMessage defaultMessage="Add to planned" />
          </Button>
          <Button>
            <FormattedMessage defaultMessage="Start reading" />
          </Button>
        </div>
      </div>
    </div>
  );
}
