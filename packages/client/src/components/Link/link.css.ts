import { style } from '@vanilla-extract/css';

import { vars } from '../../style';
import { button } from '../Button/button.css';

export const link = style([
  button.underlined,
  {
    textDecoration: 'none',
    width: 'fit-content',
    selectors: {
      '&:hover:not(.active):not(:active)': {
        textDecoration: 'underline',
        textDecorationColor: vars.color.ink3,
        textUnderlineOffset: vars.space.s1,
      },
      '&.active:not(:active)': {
        borderBottomColor: vars.color.ink,
      },
    },
  },
]);
