import { styleVariants } from '@vanilla-extract/css';

import { typography, vars } from '@/style';

export const label = styleVariants({
  default: [typography.uppercaseLabel],
  error: [typography.uppercaseLabel, { color: vars.color.bad }],
});
