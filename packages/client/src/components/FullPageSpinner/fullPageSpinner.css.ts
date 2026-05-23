import { style } from '@vanilla-extract/css';

import { flex } from '../../style';

export const container = style([
  flex.center,
  {
    position: 'absolute',
    inset: 0,
  },
]);
