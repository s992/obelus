import { style } from '@vanilla-extract/css';

import { flex, sectionDivider, vars } from '@/style';

export const header = style([
  flex.column,
  {
    gap: vars.space.s4,
    paddingBottom: vars.space.s4,
    marginBottom: vars.space.s6,
    borderBottom: sectionDivider,
  },
]);
export const title = style([
  flex.container,
  {
    alignItems: 'baseline',
    gap: vars.space.s4,
  },
]);
