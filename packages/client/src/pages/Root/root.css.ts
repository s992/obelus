import { style } from '@vanilla-extract/css';

import { typography, vars } from '../../style';

export const pageWrapper = style({
  backgroundColor: vars.color.bg,
});

export const container = style({
  maxWidth: '1280px',
  padding: vars.space.s7,
  minHeight: '100vh',
  margin: '0 auto',
});

export const headerContainer = style({
  display: 'flex',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${vars.color.rule}`,
  paddingBottom: vars.space.s4,
  marginBottom: vars.space.s6,
});

export const brand = style([
  typography.brand,
  {
    display: 'flex',
    alignItems: 'center',
    gap: vars.space.s4,
    textDecoration: 'none',
  },
]);

export const obelusMark = style({
  transform: 'translateY(-1px)',
});

export const navSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s5,
});

export const searchButton = style({
  transform: 'translateY(2px)', // better horizontal alignment
});
