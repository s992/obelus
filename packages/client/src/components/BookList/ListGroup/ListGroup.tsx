import type { Book } from '@obelus/shared/types';
import type { Ref } from 'react';
import { FormattedMessage } from 'react-intl';

import { useBookListContext } from '@/components/BookList/context';
import { flex } from '@/style';

import { ListGroupRow } from './ListGroupRow';
import { group, gutter, gutterCount, gutterMonth, gutterYear } from './listGroup.css';

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
          <ListGroupRow key={book.id} book={book} variant={variant} isPublic={isPublic} />
        ))}
      </div>
    </div>
  );
}
