import { styleVariants } from '@vanilla-extract/css';

import { vars } from './contract.css';

export const judgment = styleVariants({
  accepted: { color: `${vars.color.good} !important` },
  rejected: { color: `${vars.color.bad} !important` },
  mixed: { color: `${vars.color.warn} !important` },
});
