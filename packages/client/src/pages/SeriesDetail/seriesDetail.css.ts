import { style } from '@vanilla-extract/css';

import { flex, typography, vars } from '../../style';

export const pageContainer = style([
  flex.column,
  {
    gap: vars.space.s6,
  },
]);

export const position = style([
  typography.display,
  {
    color: vars.color.rule,
  },
]);

export const smallCell = style({
  width: 90,
});

export const link = style({
  textDecoration: 'none',
  width: 'fit-content',
  display: 'inline-block',
  ':hover': {
    textDecoration: 'underline',
    textDecorationColor: vars.color.fieldRule,
    textUnderlineOffset: vars.space.s1,
  },
});
