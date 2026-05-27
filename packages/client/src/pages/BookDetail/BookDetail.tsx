import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { FormattedMessage } from 'react-intl';

import { useTRPC } from '@/client';
import { BookCover } from '@/components/BookCover';
import { FullContainerSpinner } from '@/components/FullContainerSpinner';
import { Link } from '@/components/Link';
import { LoadError } from '@/components/LoadError';
import { StatusCell } from '@/features/StatusCell';
import { useFormatLongDate } from '@/hooks/useFormatLongDate';
import { useFormatPublishYear } from '@/hooks/useFormatPublishYear';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { mediaQuery, typography } from '@/style';

import {
  actions,
  author,
  container,
  coverWrapper,
  description,
  header,
  mainContent,
  meta,
  metaRow,
  seriesLink,
  sidebar,
  title,
} from './bookDetail.css';
import { RecordContent } from './RecordContent';

export function BookDetail() {
  const isMobile = useMediaQuery(mediaQuery.tablet);
  const { bookId } = useParams({ from: '/_layout/_authenticated/book/$bookId' });
  const trpc = useTRPC();
  const { data: book, isLoading, isError } = useQuery(trpc.book.byId.queryOptions({ id: parseInt(bookId) }));
  const { data: notes } = useQuery(
    trpc.note.list.queryOptions({ id: book?.record?.id ?? '' }, { enabled: !!book?.record?.id }),
  );
  const formatPublishDate = useFormatPublishYear();
  const formatLongDate = useFormatLongDate();

  if (isLoading) {
    return <FullContainerSpinner />;
  }

  if (isError || !book) {
    return <LoadError title={<FormattedMessage defaultMessage="Failed to load book." />} />;
  }

  const lastTouched = dayjs(book?.record?.createdAt).isAfter(notes?.[0]?.createdAt)
    ? book?.record?.createdAt
    : notes?.[0]?.createdAt;

  return (
    <div className={container}>
      <div className={sidebar}>
        <div className={coverWrapper}>
          <BookCover book={book} size={isMobile ? 'medium' : 'xlarge'} />
        </div>
        <dl className={meta}>
          {book.record && (
            <>
              <div className={metaRow}>
                <dt className={typography.uppercaseLabel}>
                  <FormattedMessage defaultMessage="first entered" />
                </dt>
                <dd className={typography.label}>{formatLongDate(book.record.createdAt)}</dd>
              </div>
              <div className={metaRow}>
                <dt className={typography.uppercaseLabel}>
                  <FormattedMessage defaultMessage="last touched" />
                </dt>
                <dd className={typography.label}>{formatLongDate(lastTouched)}</dd>
              </div>
            </>
          )}
          <div className={metaRow}>
            <dt className={typography.uppercaseLabel}>
              <FormattedMessage defaultMessage="published" />
            </dt>
            <dd className={typography.label}>{formatPublishDate(book.releaseDate)}</dd>
          </div>
          <div className={metaRow}>
            <dt className={typography.uppercaseLabel}>
              <FormattedMessage defaultMessage="pages" />
            </dt>
            <dd className={typography.label}>{book.pages}</dd>
          </div>
        </dl>
      </div>
      <div className={mainContent}>
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
        <div className={description}>{book.description}</div>
        {book.record ? (
          <RecordContent book={book} notes={notes} />
        ) : (
          <div className={actions}>
            <StatusCell bookId={book.id} seriesId={book.series?.id} layout="horizontal" />
          </div>
        )}
      </div>
    </div>
  );
}
