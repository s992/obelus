import type { Book } from '@obelus/shared/types';
import { Link } from '@tanstack/react-router';
import type { Ref } from 'react';
import { FormattedMessage } from 'react-intl';

import { flex } from '../../../style';
import { BookCover } from '../../BookCover';
import { useBookListContext } from '../context';
import { Meta } from '../Meta';
import { JudgmentQuickActions, PlannedQuickActions } from '../QuickActions';
import {
  author,
  group,
  gutter,
  gutterCount,
  gutterMonth,
  gutterYear,
  judgmentAccent,
  listEntry,
  listRow,
  title,
  titleAndAuthor,
} from './listGroup.css';

type Props = {
  books: Book[];
  date: string;
  ref?: Ref<HTMLDivElement>;
};

export function ListGroup({ books, date, ref }: Props) {
  const { variant, isPublic } = useBookListContext();
  const [month, year] = date.split(' ');

  return (
    <div className={group} ref={ref}>
      <div className={gutter}>
        <span className={gutterMonth}>{month}</span>
        <span className={gutterYear}>{year}</span>
        <span className={gutterCount}>
          <FormattedMessage defaultMessage="{count} books" values={{ count: books.length }} />
        </span>
      </div>
      <div className={flex.column}>
        {books.map((book) => (
          <div key={book.id} className={listRow}>
            {variant === 'finished' && (
              <span
                className={book.record?.judgment ? judgmentAccent[book.record.judgment] : judgmentAccent.undecided}
              />
            )}
            <Link to="/book/$bookId" params={{ bookId: book.id.toString() }}>
              <BookCover book={book} />
            </Link>
            <div className={listEntry}>
              <div className={titleAndAuthor}>
                <Link to="/book/$bookId" params={{ bookId: book.id.toString() }} className={title}>
                  {book.title}
                </Link>
                <span className={author}>{book.author}</span>
              </div>
              <Meta book={book} />
              {!isPublic && variant === 'reading' && <JudgmentQuickActions book={book} />}
              {!isPublic && variant === 'planned' && <PlannedQuickActions book={book} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
