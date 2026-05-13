import { styleVariants } from '@vanilla-extract/css';

import { vars } from './contract.css';

export const judgment = styleVariants({
  accepted: { color: vars.color.good },
  rejected: { color: vars.color.bad },
  mixed: { color: vars.color.warn },
});
