import { style } from '@vanilla-extract/css';

import { flex, vars } from '../../../style';

export const container = style([
  flex.column,
  {
    gap: vars.space.s4,
  },
]);

export const formContainer = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: vars.space.s5,
});

export const submitButton = style({
  gridColumn: 2,
  justifySelf: 'end',
});
