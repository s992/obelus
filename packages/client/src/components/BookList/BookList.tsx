import type { Book, Judgment, Status } from '@obelus/shared/types';
import dayjs from 'dayjs';
import get from 'lodash.get';
import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useIntersectionObserver } from 'usehooks-ts';

import { useListPageContext } from '../../pages/ListPage/context';
import { typography } from '../../style';
import { Button } from '../Button';
import { chipDot, filterBar } from './bookList.css';
import { BookListContextProvider } from './context';
import { ListGroup } from './ListGroup';
import { ListHeader } from './ListHeader';

type Props = {
  variant: Status;
  books: Book[];
  totalCount: number;
  renderEmptyState: () => ReactNode;
  filter?: Judgment | null;
  onFilterChanged?: (filter: Judgment | null) => void;
  isPublic?: boolean;
};

export function BookList({ variant, books, totalCount, renderEmptyState, filter, onFilterChanged, isPublic }: Props) {
  const { hasNextPage, fetchNextPage } = useListPageContext();
  const headerI18n = useHeaderI18n();
  const grouped = groupBooks(variant, books);
  const dates = Object.keys(grouped);

  const { ref: intersectionRef } = useIntersectionObserver({
    onChange: (isVisible) => {
      if (isVisible && hasNextPage) {
        fetchNextPage();
      }
    },
    threshold: 0.5,
  });

  return (
    <BookListContextProvider value={{ variant, isPublic: !!isPublic }}>
      <section>
        {!isPublic && (
          <ListHeader title={headerI18n[variant]} count={totalCount}>
            {variant === 'finished' && onFilterChanged && dates.length && (
              <div className={filterBar}>
                <Button variant="chip" isSelected={!filter} onPress={() => onFilterChanged(null)}>
                  <FormattedMessage defaultMessage="all" />
                </Button>
                <Button variant="chip" isSelected={filter === 'accepted'} onPress={() => onFilterChanged('accepted')}>
                  <span className={chipDot.accepted} />
                  <FormattedMessage defaultMessage="accepted" />
                </Button>
                <Button variant="chip" isSelected={filter === 'mixed'} onPress={() => onFilterChanged('mixed')}>
                  <span className={chipDot.mixed} />
                  <FormattedMessage defaultMessage="mixed" />
                </Button>
                <Button variant="chip" isSelected={filter === 'rejected'} onPress={() => onFilterChanged('rejected')}>
                  <span className={chipDot.rejected} />
                  <FormattedMessage defaultMessage="rejected" />
                </Button>
              </div>
            )}
          </ListHeader>
        )}
        {dates.length ? (
          dates.map((date, idx) => (
            <ListGroup
              key={date}
              books={grouped[date] ?? []}
              date={date}
              ref={idx === dates.length - 1 ? intersectionRef : undefined}
            />
          ))
        ) : (
          <div className={typography.body}>{renderEmptyState()}</div>
        )}
      </section>
    </BookListContextProvider>
  );
}

function useHeaderI18n() {
  const intl = useIntl();

  return {
    finished: intl.formatMessage({ defaultMessage: 'read' }),
    planned: intl.formatMessage({ defaultMessage: 'planned' }),
    reading: intl.formatMessage({ defaultMessage: 'reading' }),
  } satisfies Record<Status, string>;
}

const GROUP_DATE_PATH: Record<Status, string> = {
  finished: 'record.finishedAt',
  planned: 'createdAt',
  reading: 'record.startedAt',
};

function groupBooks(variant: Status, books: Book[]) {
  const datePath = GROUP_DATE_PATH[variant];

  return books.reduce(
    (acc, book) => {
      const date = dayjs(get(book, datePath));
      const formatted = date.format('MMMM YYYY');

      if (!acc[formatted]) {
        acc[formatted] = [];
      }

      return {
        ...acc,
        [formatted]: [...acc[formatted], book],
      };
    },
    {} as Record<string, Book[]>,
  );
}
