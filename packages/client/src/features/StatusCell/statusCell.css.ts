import { style } from '@vanilla-extract/css';

import { flex, typography, vars } from '../../style';

export const statusOrJudgment = style([
  flex.container,
  typography.body,
  {
    gap: vars.space.s2,
  },
]);

export const responsiveLabel = style({
  '@media': {
    '(min-width: 640px)': {
      display: 'none',
    },
  },
});
