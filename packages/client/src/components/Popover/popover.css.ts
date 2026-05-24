import { style } from '@vanilla-extract/css';

import { sectionDivider, vars } from '@/style';

export const popover = style({
  background: vars.color.surface,
  border: sectionDivider,
  borderRadius: vars.radius.sm,
  padding: vars.space.s4,
  boxShadow: `0 1px 0 ${vars.color.rule}, 0 8px 24px -8px rgba(20, 20, 15, 0.12)`,
});
