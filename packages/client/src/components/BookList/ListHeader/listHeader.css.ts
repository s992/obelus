import { style } from '@vanilla-extract/css';

import { flex, typography, vars } from '../../../style';

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
