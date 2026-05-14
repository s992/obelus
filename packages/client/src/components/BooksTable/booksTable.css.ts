import { style } from '@vanilla-extract/css';

import { vars } from '../../style';

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
