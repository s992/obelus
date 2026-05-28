import { style } from '@vanilla-extract/css';

import { flex, typography, vars } from '@/style';

export const container = style([
  flex.container,
  typography.uppercaseLabel,
  {
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: vars.space.s5,
    paddingTop: vars.space.s4,
    color: vars.color.ink2,
    lineHeight: '16px',
  },
]);

export const current = style({
  color: vars.color.ink,
});
