import { style, styleVariants } from '@vanilla-extract/css';

import { flex, typography, vars } from '@/style';

export const filterBar = style([
  flex.container,
  {
    gap: vars.space.s2,
    alignItems: 'center',
  },
]);

const baseChipDot = style({
  width: 6,
  height: 6,
  borderRadius: vars.radius.pill,
});

export const chipDot = styleVariants({
  accepted: [baseChipDot, { background: vars.color.good }],
  mixed: [baseChipDot, { background: vars.color.warn }],
  rejected: [baseChipDot, { background: vars.color.bad }],
});

export const separator = style([
  typography.label,
  {
    color: vars.color.ink3,
    opacity: 0.55,
  },
]);
