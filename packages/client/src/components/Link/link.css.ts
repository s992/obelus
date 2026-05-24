import { style } from '@vanilla-extract/css';

import { button } from '@/components/Button/button.css';
import { vars } from '@/style';

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
