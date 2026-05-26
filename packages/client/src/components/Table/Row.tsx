import clsx from 'clsx';
import { Row as AriaRow, type RowProps } from 'react-aria-components';

import { row } from './table.css';

type Props<T extends object> = {
  className?: string;
} & RowProps<T>;

export function Row<T extends object>({ className, ...rest }: Props<T>) {
  return <AriaRow {...rest} className={clsx(row, className)} />;
}
