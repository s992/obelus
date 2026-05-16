import type { Book } from '@obelus/shared/types';
import clsx from 'clsx';
import type { CSSProperties, ReactNode } from 'react';
import { GridList, GridListItem } from 'react-aria-components';
import { FormattedMessage, useIntl } from 'react-intl';
import { useIntersectionObserver } from 'usehooks-ts';

import { useFormatLongDate } from '../../hooks/useFormatLongDate';
import { useFormatPublishYear } from '../../hooks/useFormatPublishYear';
import { flex, typography } from '../../style';
import { BookCover } from '../BookCover';
import { Link } from '../Link';
import { TitleAuthorStack } from '../TitleAuthorStack';
import { ActionCell } from './ActionCell';
import { actions, gridCell, gridRow, header, inlineLabel, smallCell, wrapper } from './booksTable.css';

type Columns = {
  started?: boolean;
  finished?: boolean;
  added?: boolean;
};

type Props = {
  books: Book[];
  label: string;
  renderEmptyState: () => ReactNode;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  columns?: Columns;
};

export function BooksTable({ books, label, renderEmptyState, fetchNextPage, hasNextPage, columns }: Props) {
  const intl = useIntl();
  const formatPublishYear = useFormatPublishYear();
  const formatLongDate = useFormatLongDate();

  const { ref: intersectionRef } = useIntersectionObserver({
    onChange: (isVisible) => {
      console.log(isVisible, hasNextPage);
      if (isVisible && hasNextPage) {
        fetchNextPage();
      }
    },
    threshold: 0.5,
  });

  if (books.length === 0) {
    return <span className={typography.body}>{renderEmptyState()}</span>;
  }

  const gridStyle = {
    '--grid-template-cols': buildGridTemplateColumns(columns),
    '--grid-template-rows': buildGridTemplateRows(columns),
  } as CSSProperties;

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
        {books.map((book, idx) => {
          const publishYear = formatPublishYear(book.releaseDate);

          return (
            <GridListItem
              ref={hasNextPage && idx === books.length - 1 ? intersectionRef : null}
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
                <Link to="/book/$bookId" params={{ bookId: book.id.toString() }}>
                  <TitleAuthorStack title={book.title} author={book.author} />
                </Link>
              </div>
              <div className={gridCell}>
                <span className={inlineLabel}>
                  <FormattedMessage defaultMessage="published" />
                </span>
                {publishYear}
              </div>
              {columns?.added !== false && (
                <div className={gridCell}>
                  <span className={inlineLabel}>
                    <FormattedMessage defaultMessage="added" />
                  </span>
                  {formatLongDate(book.record?.createdAt)}
                </div>
              )}
              {columns?.started !== false && (
                <div className={gridCell}>
                  <span className={inlineLabel}>
                    <FormattedMessage defaultMessage="started" />
                  </span>
                  {formatLongDate(book.record?.startedAt)}
                </div>
              )}
              {columns?.finished !== false && (
                <div className={gridCell}>
                  <span className={inlineLabel}>
                    <FormattedMessage defaultMessage="finished" />
                  </span>
                  {formatLongDate(book.record?.finishedAt)}
                </div>
              )}
              <div className={clsx(flex.verticalCenter, actions)}>
                <ActionCell record={book.record} />
              </div>
            </GridListItem>
          );
        })}
      </GridList>
    </div>
  );
}

function buildGridTemplateColumns(columns?: Columns): string {
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

function buildGridTemplateRows(columns?: Columns): string {
  const parts = ['1fr', '0.5fr'];

  if (columns?.added !== false) {
    parts.push('0.5fr');
  }

  if (columns?.started !== false) {
    parts.push('0.5fr');
  }

  if (columns?.finished !== false) {
    parts.push('0.5fr');
  }

  return parts.join(' ');
}
