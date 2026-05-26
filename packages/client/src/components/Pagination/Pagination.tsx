import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { IconButton } from '../IconButton';
import { container, current } from './pagination.css';

type Props<T> = {
  children: (records: T[]) => ReactNode;
  records: T[];
  totalRecords: number;
  pageSize: number;
  hasNextPage: boolean;
  onFetchNextPage: () => Promise<unknown>;
};

export function Pagination<T>({ children, records, totalRecords, pageSize, hasNextPage, onFetchNextPage }: Props<T>) {
  const intl = useIntl();
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const maxPages = Math.max(Math.ceil(totalRecords / pageSize), 1);
  const pageStart = (page - 1) * pageSize;

  const onPrevious = () => {
    setPage(Math.max(page - 1, 1));
  };

  const onNext = async () => {
    const nextPageStart = page * pageSize;

    if (records.length <= nextPageStart && hasNextPage) {
      setIsLoading(true);
      await onFetchNextPage();
      setIsLoading(false);
    }

    setPage(Math.min(page + 1, maxPages));
  };

  return (
    <>
      {children(records.slice(pageStart, pageSize * page))}
      <div className={container}>
        <IconButton
          onPress={onPrevious}
          aria-label={intl.formatMessage({ defaultMessage: 'Previous page' })}
          isDisabled={page === 1 || isLoading}
        >
          <ChevronLeft />
        </IconButton>
        <span>
          <FormattedMessage
            defaultMessage="{page} of {maxPages}"
            values={{ page: <span className={current}>{page}</span>, maxPages }}
          />
        </span>
        <IconButton
          onPress={onNext}
          aria-label={intl.formatMessage({ defaultMessage: 'Next page' })}
          isDisabled={page === maxPages || isLoading}
        >
          <ChevronRight />
        </IconButton>
      </div>
    </>
  );
}
