import { style, styleVariants } from '@vanilla-extract/css';

import { typography, vars } from '../../style';

const baseAlert = style([
  typography.body,
  {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: vars.space.s3,
    alignItems: 'start',
    padding: `${vars.space.s3} ${vars.space.s4}`,
    border: `1px solid ${vars.color.fieldRule}`,
    borderLeftWidth: 2,
    borderRadius: vars.radius.sm,
    backgroundColor: vars.color.surface,
  },
]);

export const alert = styleVariants({
  error: [
    baseAlert,
    {
      borderColor: `color-mix(in oklab, ${vars.color.bad} 35%, ${vars.color.rule})`,
      borderLeftColor: vars.color.bad,
      backgroundColor: `color-mix(in oklab, ${vars.color.bad} 6%, ${vars.color.surface})`,
    },
  ],
  success: [
    baseAlert,
    {
      borderColor: `color-mix(in oklab, ${vars.color.good} 35%, ${vars.color.rule})`,
      borderLeftColor: vars.color.good,
      backgroundColor: `color-mix(in oklab, ${vars.color.good} 6%, ${vars.color.surface})`,
    },
  ],
});

export const formattedAlertBody = style({
  margin: `${vars.space.s2} 0 0 0`,
});
