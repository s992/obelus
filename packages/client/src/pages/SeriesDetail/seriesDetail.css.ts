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
  },
]);

export const position = style([
  typography.display,
  {
    color: vars.color.rule,
  },
]);

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
