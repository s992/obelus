import { style } from '@vanilla-extract/css';

import { typography } from '../../style';

export const table = style([
  typography.body,
  {
    width: '100%',
    borderCollapse: 'collapse',
  },
]);
