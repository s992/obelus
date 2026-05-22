import { style } from '@vanilla-extract/css';

import { flex, mediaQuery, sectionDivider, vars } from '../../style';

export const container = style({
  display: 'grid',
  gridTemplate: 'auto 1fr / repeat(2, 1fr)',
  gap: vars.space.s6,
  '@media': {
    [mediaQuery.mobile]: {
      display: 'flex',
      flexDirection: 'column',
    },
  },
});

export const section = style([
  flex.column,
  {
    gap: vars.space.s5,
    padding: vars.space.s5,
    background: vars.color.surface,
    border: sectionDivider,
  },
]);

export const publicUrlSection = style([
  section,
  {
    '@media': {
      [mediaQuery.mobile]: {
        gridRowStart: 2,
      },
    },
  },
]);

export const importsSection = style([
  section,
  {
    gridColumn: 'span 2 / span 2',
    gridRowStart: 2,
    '@media': {
      [mediaQuery.mobile]: {
        gridRowStart: 3,
      },
    },
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
    wordBreak: 'break-all',
  },
]);
