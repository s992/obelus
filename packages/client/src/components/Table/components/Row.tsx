import clsx from 'clsx';
import { Row as AriaRow, type RowProps } from 'react-aria-components';

import { row } from './row.css';

type Props<T> = {} & RowProps<T>;

export function Row<T extends object>({ className, ...rest }: Props<T>) {
  return <AriaRow {...rest} className={clsx(row, className)} />;
}
