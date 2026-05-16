import type { Status } from '@obelus/shared/types';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useTRPC } from '../../client';
import { BooksTable } from '../../components/BooksTable';
import { FullPageSpinner } from '../../components/FullPageSpinner';

type Columns = {
  started?: boolean;
  finished?: boolean;
  added?: boolean;
};

type Props = {
  status: Status;
  label: string;
  columns?: Columns;
  renderEmptyState: () => ReactNode;
};

export function BookList({ status, label, columns, renderEmptyState }: Props) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.record.list.queryOptions({ status }));

  if (isLoading) {
    return <FullPageSpinner />;
  }

  return <BooksTable books={data?.books ?? []} label={label} columns={columns} renderEmptyState={renderEmptyState} />;
}
