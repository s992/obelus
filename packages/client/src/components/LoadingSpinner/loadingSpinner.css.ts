import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '../../style';

const baseSpinner = style({ color: vars.color.ink });

export const spinner = styleVariants({
  small: [baseSpinner, { width: 16, height: 16 }],
  med: [baseSpinner, { width: 32, height: 32 }],
  large: [baseSpinner, { width: 64, height: 64 }],
  xlarge: [baseSpinner, { width: 96, height: 96 }],
});
