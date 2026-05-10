import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '../../style';

const baseSpinner = style({ color: vars.color.ink });

export const spinner = styleVariants({
  button: [baseSpinner, { width: 16, height: 16 }],
  xl: [baseSpinner, { width: 96, height: 96 }],
});
