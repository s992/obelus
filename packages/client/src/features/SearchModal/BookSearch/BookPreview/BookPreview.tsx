import type { Book } from '@obelus/shared/types';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { BookCover } from '@/components/BookCover';
import { StatusCell } from '@/features/SearchModal/BookSearch/StatusCell';
import { useFormatDate } from '@/hooks/useFormatDate';
import { useFormatPublishYear } from '@/hooks/useFormatPublishYear';
import { typography } from '@/style';

import { coverContainer, metaList, metaRow, metaValue, title, titleAuthorStack } from './bookPreview.css';

type Props = {
  book: Book;
};

export function BookPreview({ book }: Props) {
  const formatPublishDate = useFormatPublishYear();
  const formatStatusDate = useFormatDate('MMM DD, YYYY');

  return (
    <>
      <div className={coverContainer}>
        <BookCover book={book} size="large" />
      </div>
      <div className={titleAuthorStack}>
        <div className={title}>{book.title}</div>
        <div className={typography.uppercaseLabel}>{book.author}</div>
      </div>
      <dl className={metaList}>
        <MetaRow title={<FormattedMessage defaultMessage="published" />}>{formatPublishDate(book.releaseDate)}</MetaRow>
        {book.series && (
          <MetaRow title={<FormattedMessage defaultMessage="series" />}>
            <FormattedMessage
              defaultMessage="{series} · {position}<nbsp></nbsp>of<nbsp></nbsp>{total}"
              values={{
                series: book.series?.name,
                position: book.series?.position,
                total: book.series?.bookCount,
                nbsp: () => <>&nbsp;</>,
              }}
            />
          </MetaRow>
        )}
        <MetaRow title={<FormattedMessage defaultMessage="status" />}>
          <StatusCell record={book.record} />
        </MetaRow>
        {book.record?.status === 'finished' && (
          <MetaRow title={<FormattedMessage defaultMessage="finished" />}>
            {formatStatusDate(book.record.finishedAt)}
          </MetaRow>
        )}
        {book.record?.status === 'reading' && (
          <MetaRow title={<FormattedMessage defaultMessage="started" />}>
            {formatStatusDate(book.record.startedAt)}
          </MetaRow>
        )}
        {book.record?.status === 'planned' && (
          <MetaRow title={<FormattedMessage defaultMessage="added" />}>
            {formatStatusDate(book.record.createdAt)}
          </MetaRow>
        )}
      </dl>
    </>
  );
}

function MetaRow({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className={metaRow}>
      <dt className={typography.uppercaseLabel}>{title}</dt>
      <dd className={metaValue}>{children}</dd>
    </div>
  );
}
