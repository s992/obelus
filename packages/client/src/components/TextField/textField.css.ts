import { style, styleVariants } from '@vanilla-extract/css';

import { typography, vars } from '../../style';

const baseInput = style([
  typography.body,
  {
    backgroundColor: vars.color.surface,
    border: `1px solid ${vars.color.fieldRule}`,
    borderRadius: vars.radius.sm,
    padding: `${vars.space.s3} ${vars.space.s4}`,
    transition: 'border-color .15s ease',
    ':focus': {
      outline: 'none',
      borderColor: vars.color.ink,
    },
  },
]);

export const input = styleVariants({
  default: [baseInput],
  error: [baseInput, { borderColor: vars.color.bad, ':focus': { borderColor: vars.color.bad } }],
});
