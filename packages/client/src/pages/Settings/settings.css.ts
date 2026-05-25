import { style } from '@vanilla-extract/css';

import { flex, sectionDivider, vars } from '@/style';

export const tabPanel = style({
  marginTop: vars.space.s4,
});

export const formSection = style([
  flex.column,
  {
    gap: vars.space.s5,
    padding: vars.space.s5,
    background: vars.color.surface,
    border: sectionDivider,
  },
]);
