import { style } from '@vanilla-extract/css';

import { flex, vars } from '../../style';

export const container = style({
  display: 'grid',
  gridTemplate: 'repeat(2, 1fr) / repeat(2, 1fr)',
  gap: vars.space.s6,
});

export const section = style([
  flex.column,
  {
    gap: vars.space.s5,
    padding: vars.space.s5,
    background: vars.color.surface,
    border: `1px solid ${vars.color.rule}`,
  },
]);

export const importsSection = style([
  section,
  {
    gridColumn: 'span 2 / span 2',
    gridRowStart: 2,
  },
]);

export const privacyButton = style({
  display: 'inline-flex',
});

export const recordUrlContainer = style([
  flex.container,
  {
    gap: vars.space.s3,
    alignItems: 'center',
  },
]);
