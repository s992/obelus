import clsx from 'clsx';
import { TableBody as AriaTableBody, type TableBodyProps } from 'react-aria-components';

import { tableBody } from './tableBody.css';

type Props<T> = {} & TableBodyProps<T>;

export function TableBody<T extends object>({ className, ...rest }: Props<T>) {
  return <AriaTableBody {...rest} className={clsx(tableBody, className)} />;
}
