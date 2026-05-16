import { style } from '@vanilla-extract/css';

import { flex, gridHeader, gridRow as gridRowBase, mediaQuery, typography, vars } from '../../style';

export const wrapper = style([
  typography.body,
  {
    width: '100%',
    display: 'grid',
  },
]);

export const header = style([gridHeader, { gridTemplateColumns: 'var(--grid-template)' }]);

export const gridRow = style([
  gridRowBase,
  {
    gridTemplateColumns: 'var(--grid-template)',
    '@media': {
      [mediaQuery.mobile]: {
        gridTemplateColumns: '56px 1fr',
        gridTemplateRows: '1fr 0.5fr 0.5fr',
        columnGap: vars.space.s4,
        rowGap: 0,
        selectors: {
          '&:first-child': {
            borderTop: 'none',
          },
        },
      },
    },
  },
]);

export const smallCell = style({
  width: 90,
  '@media': {
    [mediaQuery.mobile]: {
      gridRow: 'span 3 / span 3',
    },
  },
});

export const actions = style({
  '@media': {
    [mediaQuery.mobile]: {
      display: 'none',
    },
  },
});

export const gridCell = style([
  flex.verticalCenter,
  {
    '@media': {
      [mediaQuery.mobile]: {
        flexDirection: 'row',
        justifyContent: 'start',
        gap: vars.space.s1,
      },
    },
  },
]);

export const inlineLabel = style({
  '@media': {
    [mediaQuery.mobileUp]: {
      display: 'none',
    },
  },
});
