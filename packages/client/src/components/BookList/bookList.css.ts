import { style, styleVariants } from '@vanilla-extract/css';

import { flex, typography, vars } from '../../style';

export const header = style([
  flex.column,
  {
    gap: vars.space.s4,
    paddingBottom: vars.space.s4,
    marginBottom: vars.space.s6,
    borderBottom: `1px solid ${vars.color.rule}`,
  },
]);
export const title = style([
  flex.container,
  {
    alignItems: 'baseline',
    gap: vars.space.s4,
  },
]);

export const headerCount = style([
  typography.label,
  {
    color: vars.color.ink3,
    textTransform: 'uppercase',
  },
]);

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
