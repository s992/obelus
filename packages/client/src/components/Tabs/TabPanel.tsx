import clsx from 'clsx';
import { TabPanel as AriaTabPanel, type TabPanelProps } from 'react-aria-components';

type Props = {
  className?: string;
} & TabPanelProps;

export function TabPanel({ className, ...rest }: Props) {
  return <AriaTabPanel {...rest} className={clsx(className)} />;
}
