import clsx from 'clsx';
import { TableHeader as AriaTableHeader, type TableHeaderProps } from 'react-aria-components';

type Props<T extends object> = {
  className?: string;
} & TableHeaderProps<T>;

export function TableHeader<T extends object>({ className, ...rest }: Props<T>) {
  return <AriaTableHeader {...rest} className={clsx(className)} />;
}
