import { globalStyle, style } from '@vanilla-extract/css';

import { typography, vars } from '../../style';

export const wrapper = style([
  typography.body,
  {
    display: 'flex',
    alignItems: 'center',
    gap: vars.space.s2,
    border: 0,
    borderBottom: `1px solid ${vars.color.fieldRule}`,
    background: 'transparent',
    padding: `${vars.space.s3} ${vars.space.s2}`,
    transition: 'border-color .15s ease',
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

const focusSelector = `${wrapper}:has(input[data-focused=true])`;

globalStyle(focusSelector, {
  borderBottomColor: vars.color.ink,
});

globalStyle(`${focusSelector} ${icon}`, {
  color: vars.color.ink,
});
