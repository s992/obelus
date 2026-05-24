import type { Book, Status } from '@obelus/shared/types';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { separator } from '@/components/BookList/bookList.css';
import { useFormatDate } from '@/hooks/useFormatDate';
import { useFormatDateDistance } from '@/hooks/useFormatDateDistance';
import { useFormatPublishYear } from '@/hooks/useFormatPublishYear';
import { judgment } from '@/style';

import { container, judgmentMeta } from './meta.css';

type Props = {
  book: Book;
  variant: Status | 'untracked';
};

export function Meta({ book, variant }: Props) {
  const formatYear = useFormatPublishYear();
  const formatDate = useFormatDate('MMM DD');
  const formatDistance = useFormatDateDistance();
  let content: ReactNode;

  switch (variant) {
    case 'finished':
      content = (
        <FormattedMessage
          defaultMessage="pub {publishDate} <sep>·</sep> {startDate} – {finishedDate} <sep>·</sep> <highlight>{judgment}</highlight>"
          values={{
            publishDate: formatYear(book.releaseDate),
            startDate: formatDate(book.record?.startedAt),
            finishedDate: formatDate(book.record?.finishedAt),
            judgment: book.record?.judgment,
            sep: (chunks) => <span className={separator}>{chunks}</span>,
            highlight: (chunks) =>
              book.record?.judgment ? (
                <span className={clsx(judgmentMeta, judgment[book.record.judgment])}>{chunks}</span>
              ) : (
                <span>
                  <FormattedMessage defaultMessage="N/A" />
                </span>
              ),
          }}
        />
      );
      break;
    case 'planned':
      content = (
        <FormattedMessage
          defaultMessage="pub {publishDate} <sep>·</sep> added {createdAt} <sep>·</sep> {distance} ago"
          values={{
            publishDate: formatYear(book.releaseDate),
            createdAt: formatDate(book.record?.createdAt),
            distance: formatDistance(book.record?.createdAt),
            sep: (chunks) => <span className={separator}>{chunks}</span>,
          }}
        />
      );
      break;
    case 'reading':
      content = (
        <FormattedMessage
          defaultMessage="pub {publishDate} <sep>·</sep> started {startedAt} <sep>·</sep> {distance} in"
          values={{
            publishDate: formatYear(book.releaseDate),
            startedAt: formatDate(book.record?.startedAt),
            distance: formatDistance(book.record?.startedAt),
            sep: (chunks) => <span className={separator}>{chunks}</span>,
          }}
        />
      );
      break;
    case 'untracked':
      content = (
        <FormattedMessage
          defaultMessage="pub {publishDate}"
          values={{
            publishDate: formatYear(book.releaseDate),
          }}
        />
      );
      break;
    default:
      content = <></>;
  }

  return <div className={container}>{content}</div>;
}
