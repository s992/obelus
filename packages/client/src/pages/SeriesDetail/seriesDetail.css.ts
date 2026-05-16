import { style } from '@vanilla-extract/css';

import { flex, gridHeader, gridRow as gridRowBase, mediaQuery, typography, vars } from '../../style';

const GRID_TEMPLATE_COLUMNS = '90px 90px 1fr 0.5fr 0.5fr';

export const pageContainer = style([
  flex.column,
  {
    gap: vars.space.s6,
  },
]);

export const header = style([gridHeader, { gridTemplateColumns: GRID_TEMPLATE_COLUMNS }]);

export const gridRow = style([
  gridRowBase,
  typography.body,
  {
    gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
    '@media': {
      [mediaQuery.mobile]: {
        gridTemplateColumns: '56px 1fr',
        gridTemplateRows: '1fr 0.5fr 0.5fr',
        columnGap: vars.space.s4,
        rowGap: 0,
      },
    },
  },
]);

export const position = style([
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

export const smallCell = style({
  width: 90,
  '@media': {
    [mediaQuery.mobile]: {
      gridRow: 'span 2 / span 2',
    },
  },
});

export const gridCell = style([
  flex.verticalCenter,
  {
    '@media': {
      [mediaQuery.mobile]: {
        justifyContent: 'start',
      },
    },
  },
]);

export const publishDate = style([
  flex.verticalCenter,
  {
    '@media': {
      [mediaQuery.mobile]: {
        gridColumnStart: 2,
        gridRowStart: 2,
        justifyContent: 'start',
      },
    },
  },
]);

export const statusCell = style([
  flex.verticalCenter,
  {
    '@media': {
      [mediaQuery.mobile]: {
        gridColumn: 'span 2 / span 2',
        gridRowStart: 3,
      },
    },
  },
]);
