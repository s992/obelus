import { style } from '@vanilla-extract/css';

import { vars } from '../../../style';

export const cell = style({
  padding: `${vars.space.s3} ${vars.space.s4} ${vars.space.s3} 0`,
  borderTop: `1px solid ${vars.color.rule}`,
  verticalAlign: 'middle',
});
