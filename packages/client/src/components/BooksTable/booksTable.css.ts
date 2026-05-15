import { style } from '@vanilla-extract/css';

import { typography, vars } from '../../style';

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
});

export const smallCell = style({
  width: 90,
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
