import { style } from '@vanilla-extract/css';

import { vars } from './contract.css';

export const pageWrapper = style({
  backgroundColor: vars.color.bg,
});

export const container = style({
  maxWidth: '1280px',
  padding: vars.space.s7,
  minHeight: '100vh',
  margin: '0 auto',
});
