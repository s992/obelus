import clsx from 'clsx';
import { Tabs as AriaTabs, type TabsProps } from 'react-aria-components';

type Props = {
  className?: string;
} & TabsProps;

export function Tabs({ className, ...rest }: Props) {
  return <AriaTabs {...rest} className={clsx(className)} />;
}
