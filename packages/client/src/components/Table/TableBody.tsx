import clsx from 'clsx';
import { TableBody as AriaTableBody, type TableBodyProps } from 'react-aria-components';

type Props<T extends object> = {
  className?: string;
} & TableBodyProps<T>;

export function TableBody<T extends object>({ className, ...rest }: Props<T>) {
  return <AriaTableBody {...rest} className={clsx(className)} />;
}
