import { style } from '@vanilla-extract/css';

import { sectionDivider, typography, vars } from '@/style';

export const container = style({
  position: 'relative',
});

export const table = style([
  typography.body,
  {
    width: '100%',
    borderCollapse: 'collapse',
  },
]);

export const fadedTable = style([
  table,
  {
    opacity: 0.35,
  },
]);

export const column = style([
  typography.uppercaseLabel,
  {
    paddingBottom: vars.space.s2,
    textAlign: 'left',
    fontWeight: vars.fontWeight.regular,
  },
]);

export const row = style({
  borderTop: sectionDivider,
  transition: 'background-color .15s',
  selectors: {
    '&:hover, &[data-focus-visible-within=true]': {
      background: vars.color.tint,
    },
    '&:last-child': {
      borderBottom: sectionDivider,
    },
  },
});

export const cell = style({
  padding: `${vars.space.s3} ${vars.space.s1}`,
  selectors: {
    '&[data-focus-visible=true]': {
      outline: `1px solid ${vars.color.ink3}`,
    },
  },
});
