import { type LinkComponentProps, Link as RouterLink } from '@tanstack/react-router';
import clsx from 'clsx';

import { link } from './link.css';

type Props = {} & LinkComponentProps;

export function Link({ className, ...rest }: Props) {
  return <RouterLink {...rest} className={clsx(link, className)} />;
}
