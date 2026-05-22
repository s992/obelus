import type { Book, Status } from '@obelus/shared/types';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import { useAuthContext } from '../../../context';
import { BookCover } from '../../BookCover';
import { Meta } from '../Meta';
import { JudgmentQuickActions, PlannedQuickActions, UntrackedQuickActions } from '../QuickActions';
import { author, judgmentAccent, listEntry, listRow, title, titleAndAuthor, titleLink } from './listGroup.css';

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
      <MaybeBookLink bookId={book.id}>
        <BookCover book={book} />
      </MaybeBookLink>
      <div className={listEntry}>
        <div className={titleAndAuthor}>
          <MaybeBookLink bookId={book.id} classes={{ link: titleLink, noLink: title }}>
            {book.title}
          </MaybeBookLink>
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

type MaybeBookLinkProps = {
  children: ReactNode;
  bookId: number;
  classes?: {
    noLink: string;
    link: string;
  };
};

function MaybeBookLink({ children, bookId, classes }: MaybeBookLinkProps) {
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return <span className={classes?.noLink}>{children}</span>;
  }

  return (
    <Link to="/book/$bookId" params={{ bookId: bookId.toString() }} className={classes?.link}>
      {children}
    </Link>
  );
}
