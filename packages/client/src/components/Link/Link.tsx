import { createLink } from '@tanstack/react-router';
import clsx from 'clsx';
import { Link as AriaLink } from 'react-aria-components';
import type { AriaLinkProps } from 'react-aria/useLink';

import { link } from './link.css';

type Props = {
  className?: string;
} & AriaLinkProps;

function BaseLink({ className, ...rest }: Props) {
  return <AriaLink className={clsx(link, className)} {...rest} />;
}

export const Link = createLink(BaseLink);
