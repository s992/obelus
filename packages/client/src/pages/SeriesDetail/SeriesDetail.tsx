import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '../../client';
import { FormattedAlert } from '../../components/Alert';
import { BookCover } from '../../components/BookCover';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Table } from '../../components/Table';
import { TitleAuthorStack } from '../../components/TitleAuthorStack';
import { useFormatPublishYear } from '../../hooks/useFormatPublishYear';
import { flex, typography } from '../../style';
import { link, pageContainer, position, smallCell } from './seriesDetail.css';

export function SeriesDetail() {
  const { seriesId } = useParams({ from: '/_authenticated/series/$seriesId' });
  const intl = useIntl();
  const trpc = useTRPC();
  const { data: series, isLoading, isError } = useQuery(trpc.book.seriesById.queryOptions({ id: parseInt(seriesId) }));
  const formatPublishYear = useFormatPublishYear();

  if (isLoading) {
    return (
      <div className={flex.center}>
        <LoadingSpinner size="xlarge" />
      </div>
    );
  }

  if (isError || !series) {
    return (
      <FormattedAlert
        variant="error"
        title={<FormattedMessage defaultMessage="Failed to load series." />}
        message={<FormattedMessage defaultMessage="Please refresh your browser window to try again." />}
      />
    );
  }

  return (
    <div className={pageContainer}>
      <h1 className={typography.display}>{series.series.name}</h1>
      <Table
        aria-label={intl.formatMessage(
          { defaultMessage: 'Books from the series "{series}"' },
          { series: series.series.name },
        )}
      >
        <Table.Header>
          <Table.Column />
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
        <Table.Body items={series.books}>
          {(book) => (
            <Table.Row>
              <Table.Cell className={clsx(position, smallCell)}>
                <div className={flex.center}>{book.series?.position}</div>
              </Table.Cell>
              <Table.Cell className={smallCell}>
                <BookCover book={book} />
              </Table.Cell>
              <Table.Cell>
                <Link to="/book/$bookId" params={{ bookId: book.id.toString() }} className={link}>
                  <TitleAuthorStack title={book.title} author={book.author} />
                </Link>
              </Table.Cell>
              <Table.Cell>{formatPublishYear(book.releaseDate)}</Table.Cell>
              <Table.Cell>
                <Button variant="underlined">
                  <FormattedMessage defaultMessage="start reading" />
                </Button>
                <Button variant="underlined">
                  <FormattedMessage defaultMessage="add to planned" />
                </Button>
                <Button variant="underlined">
                  <FormattedMessage defaultMessage="mark read" />
                </Button>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </div>
  );
}
