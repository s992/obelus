import { style } from '@vanilla-extract/css';

import { flex, typography, vars } from '../../style';

export const wrapper = style([
  typography.body,
  {
    width: '100%',
    display: 'grid',
  },
]);

export const header = style([
  typography.label,
  {
    display: 'grid',
    gridTemplateColumns: 'var(--grid-template)',
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

export const gridRow = style({
  display: 'grid',
  gridTemplateColumns: 'var(--grid-template)',
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
      selectors: {
        '&:first-child': {
          borderTop: 'none',
        },
      },
    },
  },
});

export const smallCell = style({
  width: 90,
  '@media': {
    '(max-width: 640px)': {
      gridRow: 'span 3 / span 3',
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

export const actions = style({
  '@media': {
    '(max-width: 640px)': {
      display: 'none',
    },
  },
});

export const gridCell = style([
  flex.verticalCenter,
  {
    '@media': {
      '(max-width: 640px)': {
        flexDirection: 'row',
        justifyContent: 'start',
        gap: vars.space.s1,
      },
    },
  },
]);

export const inlineLabel = style({
  '@media': {
    '(min-width: 640px)': {
      display: 'none',
    },
  },
});
