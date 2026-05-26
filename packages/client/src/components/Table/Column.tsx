import clsx from 'clsx';
import { Column as AriaColumn, type ColumnProps } from 'react-aria-components';

import { column } from './table.css';

type Props = {
  className?: string;
} & ColumnProps;

export function Column({ className, ...rest }: Props) {
  return <AriaColumn {...rest} className={clsx(column, className)} />;
}
