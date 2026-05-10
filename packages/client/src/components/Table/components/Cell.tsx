import clsx from 'clsx';
import { Cell as AriaCell, type CellProps } from 'react-aria-components';

import { cell } from './cell.css';

type Props = {} & CellProps;

export function Cell({ className, ...rest }: Props) {
  return <AriaCell {...rest} className={clsx(cell, className)} />;
}
