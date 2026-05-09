import { style } from '@vanilla-extract/css';

import { vars } from './contract.css';

export const formRow = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s2,
});
