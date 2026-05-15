import type { Book } from '@obelus/shared/types';
import { Link } from '@tanstack/react-router';
import type { CSSProperties, ReactNode } from 'react';
import { GridList, GridListItem } from 'react-aria-components';
import { FormattedMessage, useIntl } from 'react-intl';

import { useFormatLongDate } from '../../hooks/useFormatLongDate';
import { useFormatPublishYear } from '../../hooks/useFormatPublishYear';
import { flex, typography } from '../../style';
import { BookCover } from '../BookCover';
import { TitleAuthorStack } from '../TitleAuthorStack';
import { ActionCell } from './ActionCell';
import { gridRow, header, link, smallCell, wrapper } from './booksTable.css';

type Columns = {
  started?: boolean;
  finished?: boolean;
  added?: boolean;
};

type Props = {
  books: Book[];
  label: string;
  renderEmptyState: () => ReactNode;
  columns?: Columns;
};

export function BooksTable({ books, label, renderEmptyState, columns }: Props) {
  const intl = useIntl();
  const formatPublishYear = useFormatPublishYear();
  const formatLongDate = useFormatLongDate();

  if (books.length === 0) {
    return <span className={typography.metaItalic}>{renderEmptyState()}</span>;
  }

  const gridStyle = { '--grid-template': buildGridTemplate(columns) } as CSSProperties;

  return (
    <div className={wrapper} style={gridStyle}>
      <div className={header}>
        <div />
        <div>
          <FormattedMessage defaultMessage="title · author" />
        </div>
        <div>
          <FormattedMessage defaultMessage="published" />
        </div>
        {columns?.added !== false && (
          <div>
            <FormattedMessage defaultMessage="added" />
          </div>
        )}
        {columns?.started !== false && (
          <div>
            <FormattedMessage defaultMessage="started" />
          </div>
        )}
        {columns?.finished !== false && (
          <div>
            <FormattedMessage defaultMessage="finished" />
          </div>
        )}
        <div>
          <FormattedMessage defaultMessage="judgment" />
        </div>
      </div>
      <GridList aria-label={label}>
        {books.map((book) => {
          const publishYear = formatPublishYear(book.releaseDate);

          return (
            <GridListItem
              key={book.id}
              textValue={intl.formatMessage(
                { defaultMessage: '{title} by {author}, published {publishYear}' },
                { title: book.title, author: book.author, publishYear },
              )}
              className={gridRow}
            >
              <div className={smallCell}>
                <BookCover book={book} />
              </div>
              <div className={flex.verticalCenter}>
                <Link className={link} to="/book/$bookId" params={{ bookId: book.id.toString() }}>
                  <TitleAuthorStack title={book.title} author={book.author} />
                </Link>
              </div>
              <div className={flex.verticalCenter}>{publishYear}</div>
              {columns?.added !== false && (
                <div className={flex.verticalCenter}>{formatLongDate(book.record?.createdAt)}</div>
              )}
              {columns?.started !== false && (
                <div className={flex.verticalCenter}>{formatLongDate(book.record?.startedAt)}</div>
              )}
              {columns?.finished !== false && (
                <div className={flex.verticalCenter}>{formatLongDate(book.record?.finishedAt)}</div>
              )}
              <div className={flex.verticalCenter}>
                <ActionCell record={book.record} />
              </div>
            </GridListItem>
          );
        })}
      </GridList>
    </div>
  );
}

function buildGridTemplate(columns?: Columns): string {
  const parts = ['90px', '1fr', '0.5fr'];

  if (columns?.added !== false) {
    parts.push('0.5fr');
  }

  if (columns?.started !== false) {
    parts.push('0.5fr');
  }

  if (columns?.finished !== false) {
    parts.push('0.5fr');
  }

  parts.push('0.5fr');

  return parts.join(' ');
}
