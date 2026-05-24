import { style } from '@vanilla-extract/css';

import { mediaQuery } from '@/style';

export const modal = style({
  padding: 0,
  width: 820,
  '@media': {
    [mediaQuery.search]: {
      width: 'calc(var(--visual-viewport-width) * 65%)',
    },
  },
});
