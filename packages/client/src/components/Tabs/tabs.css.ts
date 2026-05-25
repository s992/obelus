import { style } from '@vanilla-extract/css';

import { flex, sectionDivider, typography, vars } from '@/style';

export const tabList = style([
  flex.container,
  {
    gap: vars.space.s6,
    borderBottom: sectionDivider,
  },
]);

export const tab = style([
  typography.body,
  {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: vars.space.s2,
    borderBottom: `1px solid transparent`,
    marginBottom: -1,
    padding: `${vars.space.s3} 0`,
    cursor: 'pointer',
    color: vars.color.ink3,
    transition: 'color .15s, border-color .15s',
    selectors: {
      '&[data-selected=true]': {
        color: vars.color.ink,
        borderBottomColor: vars.color.ink,
      },
    },
  },
]);
