import { globalStyle, style } from '@vanilla-extract/css';

import { flex, sectionDivider, typography, vars } from '@/style';

export const wrapper = style([
  flex.container,
  {
    alignItems: 'center',
    gap: vars.space.s3,
    padding: `${vars.space.s4} ${vars.space.s5}`,
    borderBottom: sectionDivider,
  },
]);

export const input = style([
  typography.body,
  {
    outline: 'none',
    width: '100%',
    height: 32,
    background: 'transparent',
    selectors: {
      '&::placeholder': {
        color: vars.color.ink3,
      },
    },
  },
]);

export const icon = style({
  width: 14,
  height: 14,
  color: vars.color.ink3,
  transition: 'color .15s ease',
});

globalStyle(`${wrapper}:has(input[data-focused=true]) ${icon}`, {
  color: vars.color.ink,
});
