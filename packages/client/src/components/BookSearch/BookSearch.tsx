import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDebounceValue } from 'usehooks-ts';

import { useTRPC } from '../../client';
import { CoverPlaceholder } from '../CoverPlaceholder';
import { LoadingSpinner } from '../LoadingSpinner';
import { Search } from '../Search';
import { Table } from '../Table';
import {
  bookAuthor,
  bookTitle,
  container,
  cover,
  coverCell,
  spinnerContainer,
  tableContainer,
  tableHeader,
  tableRow,
} from './bookSearch.css';

export function BookSearch() {
  const intl = useIntl();
  const trpc = useTRPC();
  const searchRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounceValue(query, 500);
  const actualQuery = debouncedQuery.trim();
  const { data: results, isLoading } = useQuery(
    trpc.book.search.queryOptions({ query: actualQuery }, { enabled: actualQuery.length > 0 }),
  );

  return (
    <div className={container}>
      <Search
        label={intl.formatMessage({ defaultMessage: 'search by title or author' })}
        value={query}
        onChange={setQuery}
        ref={searchRef}
        autoFocus
      />
      {isLoading && (
        <div className={spinnerContainer}>
          <LoadingSpinner size="large" />
        </div>
      )}
      {!isLoading && results && query && (
        <div className={tableContainer}>
          <Table aria-label={intl.formatMessage({ defaultMessage: 'Search results' })}>
            <Table.Header className={tableHeader}>
              <Table.Column />
              <Table.Column isRowHeader>
                <FormattedMessage defaultMessage="title · author" />
              </Table.Column>
              <Table.Column>
                <FormattedMessage defaultMessage="published" />
              </Table.Column>
              <Table.Column>
                <FormattedMessage defaultMessage="judgment" />
              </Table.Column>
            </Table.Header>
            <Table.Body items={results}>
              {(result) => (
                <Table.Row className={tableRow} href={`/book/${result.id}`}>
                  <Table.Cell className={coverCell}>
                    {result.image?.url ? (
                      <img className={cover} src={result.image.url} />
                    ) : (
                      <CoverPlaceholder
                        author={result.contributions[0]?.author?.name ?? ''}
                        title={result.title ?? ''}
                      />
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div className={bookTitle}>{result.title}</div>
                    <div className={bookAuthor}>{result.contributions[0]?.author?.name}</div>
                  </Table.Cell>
                  <Table.Cell>{dayjs(result.release_date as string, 'YYYY-MM-DD').format('YYYY')}</Table.Cell>
                  <Table.Cell>unread</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>
      )}
    </div>
  );
}
