import clsx from 'clsx';
import { Table as AriaTable, type TableProps } from 'react-aria-components';

import { FullPageSpinner } from '../FullPageSpinner';
import { container, fadedTable, table } from './table.css';

type Props = {
  className?: string;
  isLoading?: boolean;
} & TableProps;

export function Table({ className, isLoading, ...rest }: Props) {
  return (
    <div className={container}>
      <AriaTable {...rest} className={clsx(isLoading ? fadedTable : table, className)} />
      {isLoading && <FullPageSpinner />}
    </div>
  );
}
