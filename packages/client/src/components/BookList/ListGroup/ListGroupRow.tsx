import type { Book, Status } from '@obelus/shared/types';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';

import { BookCover } from '../../BookCover';
import { Meta } from '../Meta';
import { JudgmentQuickActions, PlannedQuickActions, UntrackedQuickActions } from '../QuickActions';
import { author, judgmentAccent, listEntry, listRow, title, titleAndAuthor } from './listGroup.css';

type Props = {
  book: Book;
  variant: Status | 'untracked';
  isPublic?: boolean;
  className?: string;
};

export function ListGroupRow({ book, variant, isPublic, className }: Props) {
  return (
    <div className={clsx(listRow, className)}>
      {variant === 'finished' && (
        <span className={book.record?.judgment ? judgmentAccent[book.record.judgment] : judgmentAccent.undecided} />
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
        <Meta book={book} variant={variant} />
        {!isPublic && variant === 'reading' && <JudgmentQuickActions book={book} />}
        {!isPublic && variant === 'planned' && <PlannedQuickActions book={book} />}
        {!isPublic && variant === 'untracked' && <UntrackedQuickActions book={book} />}
      </div>
    </div>
  );
}
