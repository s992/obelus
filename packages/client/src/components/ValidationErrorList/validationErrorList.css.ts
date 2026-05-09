import { style } from '@vanilla-extract/css';

import { typography, vars } from '../../style';

export const list = style({
  listStyleType: 'none',
  margin: 0,
  padding: 0,
});

export const errorMessage = style([
  typography.body,
  {
    fontStyle: 'italic',
    color: vars.color.bad,
  },
]);

// font-family: var(--font-body);
//     font-size: 12.5px;
//     font-style: italic;
//     color: var(--bad);
//     margin-top: 2px;
//     display: flex;
//     align-items: baseline;
//     gap: 6px;
// }
