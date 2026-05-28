import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '@/style';

const baseStatusDot = style({
  display: 'inline-block',
  width: 6,
  height: 6,
  marginRight: vars.space.s2,
  transform: 'translateY(-1px)',
  verticalAlign: 'middle',
  borderRadius: vars.radius.pill,
});

export const statusDot = styleVariants({
  good: [baseStatusDot, { background: vars.color.good }],
  bad: [baseStatusDot, { background: vars.color.bad }],
  warn: [baseStatusDot, { background: vars.color.warn }],
  currentColor: [baseStatusDot, { background: 'currentColor' }],
});
