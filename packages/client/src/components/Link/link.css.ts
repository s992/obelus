import { style } from '@vanilla-extract/css';

import { vars } from '../../style';
import { button } from '../Button/button.css';

export const link = style([
  button.underlined,
  {
    textDecoration: 'none',
    selectors: {
      '&.active': {
        borderBottomColor: vars.color.ink,
      },
    },
  },
]);
