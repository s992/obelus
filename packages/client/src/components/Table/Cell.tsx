import clsx from 'clsx';
import { Cell as AriaCell, type CellProps } from 'react-aria-components';

import { cell } from './table.css';

type Props = {
  className?: string;
} & CellProps;

export function Cell({ className, ...rest }: Props) {
  return <AriaCell {...rest} className={clsx(cell, className)} />;
}
