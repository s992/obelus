import { style } from '@vanilla-extract/css';

import { mediaQuery } from './constants';
import { vars } from './contract.css';
import { typography } from './typography.css';

export const gridHeader = style([
  typography.label,
  {
    display: 'grid',
    gap: vars.space.s4,
    padding: `0 0 ${vars.space.s2} 0`,
    textAlign: 'left',
    fontWeight: 400,
    '@media': {
      [mediaQuery.mobile]: {
        display: 'none',
      },
    },
  },
]);

export const gridRow = style({
  display: 'grid',
  gap: vars.space.s4,
  padding: `${vars.space.s3} 0`,
  borderTop: `1px solid ${vars.color.rule}`,
  textDecoration: 'none',
  color: 'inherit',
});
