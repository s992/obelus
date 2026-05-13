import type { Book } from '@obelus/shared/types';
import { useIntl } from 'react-intl';

import { CoverPlaceholder } from './CoverPlaceholder';
import { cover } from './coverPlaceholder.css';

type Props = {
  book: Pick<Book, 'coverImage' | 'author' | 'title'>;
  size?: keyof typeof cover;
};

export function BookCover({ book, size = 'medium' }: Props) {
  const intl = useIntl();

  if (book.coverImage) {
    return (
      <img
        className={cover[size]}
        src={book.coverImage}
        alt={intl.formatMessage({ defaultMessage: 'Book cover for {title}' }, { title: book.title })}
      />
    );
  }

  return <CoverPlaceholder author={book.author ?? ''} title={book.title ?? ''} size={size} />;
}
