import type { Book } from '@obelus/shared/types';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { useFormatLongDate } from '../../hooks/useFormatLongDate';
import { useFormatPublishYear } from '../../hooks/useFormatPublishYear';
import { BookCover } from '../BookCover';
import { Table } from '../Table';
import { TitleAuthorStack } from '../TitleAuthorStack';
import { ActionCell } from './ActionCell';
import { link, smallCell } from './booksTable.css';

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
  const formatPublishYear = useFormatPublishYear();
  const formatLongDate = useFormatLongDate();

  return (
    <Table aria-label={label}>
      <Table.Header>
        <Table.Column />
        <Table.Column isRowHeader>
          <FormattedMessage defaultMessage="title · author" />
        </Table.Column>
        <Table.Column>
          <FormattedMessage defaultMessage="published" />
        </Table.Column>
        {columns?.added !== false && (
          <Table.Column>
            <FormattedMessage defaultMessage="added" />
          </Table.Column>
        )}
        {columns?.started !== false && (
          <Table.Column>
            <FormattedMessage defaultMessage="started" />
          </Table.Column>
        )}
        {columns?.finished !== false && (
          <Table.Column>
            <FormattedMessage defaultMessage="finished" />
          </Table.Column>
        )}
        <Table.Column>
          <FormattedMessage defaultMessage="judgment" />
        </Table.Column>
      </Table.Header>
      <Table.Body items={books} renderEmptyState={renderEmptyState}>
        {(book) => (
          <Table.Row>
            <Table.Cell className={smallCell}>
              <BookCover book={book} />
            </Table.Cell>
            <Table.Cell>
              <Link to="/book/$bookId" params={{ bookId: book.id.toString() }} className={link}>
                <TitleAuthorStack title={book.title} author={book.author} />
              </Link>
            </Table.Cell>
            <Table.Cell>{formatPublishYear(book.releaseDate)}</Table.Cell>
            {columns?.added !== false && <Table.Cell>{formatLongDate(book.record?.createdAt)}</Table.Cell>}
            {columns?.started !== false && <Table.Cell>{formatLongDate(book.record?.startedAt)}</Table.Cell>}
            {columns?.finished !== false && <Table.Cell>{formatLongDate(book.record?.finishedAt)}</Table.Cell>}
            <Table.Cell>
              <ActionCell record={book.record} />
            </Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table>
  );
}
