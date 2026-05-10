import { style } from '@vanilla-extract/css';

import { vars } from './contract.css';

export const background = style({
  backgroundColor: vars.color.bg,
});
