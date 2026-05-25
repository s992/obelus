import { style } from '@vanilla-extract/css';

import { flex, mediaQuery, vars } from '@/style';

import { formSection } from '../settings.css';

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

export const publicUrlSection = style([
  formSection,
  {
    '@media': {
      [mediaQuery.mobile]: {
        gridRowStart: 2,
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
