import { styleVariants } from '@vanilla-extract/css';

import { vars } from '@/style';

export const form = styleVariants({
  stacked: {
    display: 'grid',
    rowGap: vars.space.s5,
  },
});
