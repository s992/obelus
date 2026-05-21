import { style } from '@vanilla-extract/css';

import { typography, vars } from '../../../style';

export const container = style([
  typography.label,
  {
    display: 'inline-flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: `${vars.space.s1} ${vars.space.s2}`,
    marginTop: vars.space.s1,
    textTransform: 'uppercase',
    color: vars.color.ink3,
  },
]);

export const judgmentMeta = style([
  typography.body,
  {
    textTransform: 'lowercase',
    letterSpacing: vars.letterSpacing.display,
  },
]);
