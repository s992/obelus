import clsx from 'clsx';
import { TabPanels as AriaTabPanels, type TabPanelsProps } from 'react-aria-components';

type Props<T> = {
  className?: string;
} & TabPanelsProps<T>;

export function TabPanels<T extends object>({ className, ...rest }: Props<T>) {
  return <AriaTabPanels {...rest} className={clsx(className)} />;
}
