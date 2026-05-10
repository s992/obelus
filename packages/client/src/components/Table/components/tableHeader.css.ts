import { style } from '@vanilla-extract/css';

import { typography } from '../../../style';

export const tableHeader = style([
  typography.label,
  {
    textAlign: 'left',
    verticalAlign: 'bottom',
    fontWeight: 400,
  },
]);
