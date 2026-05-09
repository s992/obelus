import { style, styleVariants } from '@vanilla-extract/css';

import { typography, vars } from '../../style';

const baseLabel = style([
  typography.metaMono,
  {
    textTransform: 'uppercase',
    color: vars.color.ink3,
  },
]);

export const label = styleVariants({
  default: [baseLabel],
  error: [baseLabel, { color: vars.color.bad }],
});
