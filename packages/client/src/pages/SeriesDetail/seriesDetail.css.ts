import { style } from '@vanilla-extract/css';

import { flex, typography, vars } from '../../style';

const GRID_TEMPLATE_COLUMNS = '90px 90px 1fr 0.5fr 0.5fr';

export const pageContainer = style([
  flex.column,
  {
    gap: vars.space.s6,
  },
]);

export const header = style([
  typography.label,
  {
    display: 'grid',
    gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
    gap: vars.space.s4,
    padding: `0 0 ${vars.space.s2} 0`,
    textAlign: 'left',
    fontWeight: 400,
    '@media': {
      '(max-width: 640px)': {
        display: 'none',
      },
    },
  },
]);

export const gridRow = style([
  typography.body,
  {
    display: 'grid',
    gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
    gap: vars.space.s4,
    padding: `${vars.space.s3} 0`,
    borderTop: `1px solid ${vars.color.rule}`,
    textDecoration: 'none',
    color: 'inherit',
    '@media': {
      '(max-width: 640px)': {
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
      '(max-width: 640px)': {
        display: 'none',
      },
    },
  },
]);

export const smallCell = style({
  width: 90,
  '@media': {
    '(max-width: 640px)': {
      gridRow: 'span 2 / span 2',
    },
  },
});

export const link = style({
  textDecoration: 'none',
  width: 'fit-content',
  display: 'inline-block',
  ':hover': {
    textDecoration: 'underline',
    textDecorationColor: vars.color.fieldRule,
    textUnderlineOffset: vars.space.s1,
  },
});

export const gridCell = style([
  flex.verticalCenter,
  {
    '@media': {
      '(max-width: 640px)': {
        justifyContent: 'start',
      },
    },
  },
]);

export const publishDate = style([
  flex.verticalCenter,
  {
    '@media': {
      '(max-width: 640px)': {
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
      '(max-width: 640px)': {
        gridColumn: 'span 2 / span 2',
        gridRowStart: 3,
      },
    },
  },
]);
