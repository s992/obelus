import clsx from 'clsx';
import { TabList as AriaTabList, type TabListProps } from 'react-aria-components';

import { tabList } from './tabs.css';

type Props<T> = {
  className?: string;
} & TabListProps<T>;

export function TabList<T extends object>({ className, ...rest }: Props<T>) {
  return <AriaTabList {...rest} className={clsx(tabList, className)} />;
}
