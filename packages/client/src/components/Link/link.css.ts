import { style } from '@vanilla-extract/css';

import { button } from '@/components/Button/button.css';
import { vars } from '@/style';

export const link = style([
  button.link,
  {
    textDecoration: 'underline',
    textDecorationColor: 'transparent',
    textUnderlineOffset: vars.space.s2,
    width: 'fit-content',
    selectors: {
      '&:hover:not(.active, :active), &[data-focus-visible=true]': {
        textDecorationColor: vars.color.accent,
      },
      '&.active:not(:active)': {
        textDecorationColor: vars.color.ink,
      },
    },
  },
]);
