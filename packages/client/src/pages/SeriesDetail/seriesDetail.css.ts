import { style } from '@vanilla-extract/css';

import { flex, mediaQuery, sectionDivider, typography, vars } from '../../style';

export const row = style({
  display: 'grid',
  gridTemplateColumns: '96px 1fr',
  gap: vars.space.s5,
  borderTop: sectionDivider,
  '@media': {
    [mediaQuery.mobile]: {
      gridTemplateColumns: '1fr',
      gap: vars.space.s3,
      padding: `${vars.space.s4} 0`,
    },
  },
});

export const position = style([
  flex.center,
  typography.display,
  {
    color: vars.color.rule,
    '@media': {
      [mediaQuery.mobile]: {
        display: 'none',
      },
    },
  },
]);

export const bookItem = style({
  borderTop: 'none',
});
