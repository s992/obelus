import clsx from 'clsx';
import { Tab as AriaTab, type TabProps } from 'react-aria-components';

import { tab } from './tabs.css';

type Props = {
  className?: string;
} & TabProps;

export function Tab({ className, ...rest }: Props) {
  return <AriaTab {...rest} className={clsx(tab, className)} />;
}
