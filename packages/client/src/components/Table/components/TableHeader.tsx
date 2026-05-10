import clsx from 'clsx';
import { TableHeader as AriaTableHeader, type TableHeaderProps } from 'react-aria-components';

import { tableHeader } from './tableHeader.css';

type Props<T> = {} & TableHeaderProps<T>;

export function TableHeader<T extends object>({ className, ...rest }: Props<T>) {
  return <AriaTableHeader {...rest} className={clsx(tableHeader, className)} />;
}
