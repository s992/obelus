import { style } from '@vanilla-extract/css';

import { flex, sectionDivider, typography, vars } from '@/style';

export const coverContainer = style([
  flex.container,
  {
    justifyContent: 'center',
    paddingTop: vars.space.s2,
  },
]);

export const titleAuthorStack = style([
  flex.column,
  {
    gap: vars.space.s2,
  },
]);

export const title = style([
  typography.display,
  {
    fontSize: '22px',
    textWrap: 'pretty',
  },
]);

export const metaList = style([
  flex.column,
  {
    gap: vars.space.s3,
    paddingTop: vars.space.s4,
    margin: 0,
    borderTop: sectionDivider,
  },
]);

export const metaRow = style([
  flex.container,
  {
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: vars.space.s3,
  },
]);

export const metaValue = style([
  typography.uppercaseLabel,
  {
    color: vars.color.ink2,
    textAlign: 'right',
  },
]);
