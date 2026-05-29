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
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: vars.space.s2,
    borderBottom: `1px solid transparent`,
    marginBottom: -1,
    padding: `${vars.space.s3} ${vars.space.s2}`,
    cursor: 'pointer',
    color: vars.color.ink3,
    textDecoration: 'none',
    transition: 'color .15s, border-color .15s',
    selectors: {
      '&[data-selected=true]': {
        color: vars.color.ink,
        borderBottomColor: vars.color.ink,
      },
      '&::after, &::before': {
        fontFamily: vars.font.mono,
        color: vars.color.ink,
        position: 'absolute',
        top: '48%',
        transform: 'translateY(-50%)',
        transition: 'opacity .15s ease',
        pointerEvents: 'none',
        opacity: 0,
      },
      '&::before': {
        content: '[',
        left: -2,
      },
      '&::after': {
        content: ']',
        right: -2,
      },
      '&[data-focus-visible=true]::before, &[data-focus-visible=true]::after': {
        opacity: 1,
      },
    },
  },
]);
