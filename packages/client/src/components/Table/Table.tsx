import clsx from 'clsx';
import { Table as AriaTable, type TableProps } from 'react-aria-components';

import { table } from './table.css';

type Props = {} & TableProps;

export function Table({ className, ...rest }: Props) {
  return <AriaTable {...rest} className={clsx(table, className)} />;
}
