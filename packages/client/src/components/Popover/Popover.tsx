import clsx from 'clsx';
import { Popover as AriaPopover, type PopoverProps } from 'react-aria-components';

import { popover } from './popover.css';

type Props = {} & PopoverProps;

export function Popover({ className, ...props }: Props) {
  return <AriaPopover className={clsx(popover, className)} {...props} />;
}
