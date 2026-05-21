import { style } from '@vanilla-extract/css';

import { sectionDivider, typography, vars } from '../../style';

export const headerContainer = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: sectionDivider,
  paddingBottom: vars.space.s4,
  marginBottom: vars.space.s6,
});

export const brand = style([
  typography.display,
  {
    display: 'flex',
    alignItems: 'center',
    gap: vars.space.s4,
    textDecoration: 'none',
    color: vars.color.ink3,
    transition: 'color .15s',
    ':hover': {
      color: vars.color.ink,
    },
  },
]);

export const obelusMark = style({
  transform: 'translateY(-1px)',
});
