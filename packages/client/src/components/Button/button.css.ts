import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '../../style';
import { typography } from '../../style/typography.css';

const baseButton = style([
  typography.button,
  {
    display: 'flex',
    justifyContent: 'center',
    borderRadius: vars.radius.sm,
    padding: `${vars.space.s2} ${vars.space.s4}`,
    transition: 'background-color .15s ease, border-color .15s ease',
  },
]);

export const button = styleVariants({
  primary: [
    baseButton,
    {
      border: `1px solid ${vars.color.ink}`,
      background: vars.color.ink,
      color: vars.color.bg,
      ':hover': {
        background: vars.color.ink2,
        borderColor: vars.color.ink2,
      },
      selectors: {
        '&[data-disabled=true]': {
          color: vars.color.bg,
          backgroundColor: vars.color.ink3,
          borderColor: vars.color.ink3,
          cursor: 'not-allowed',
        },
      },
    },
  ],
  secondary: [
    baseButton,
    {
      border: `1px solid ${vars.color.fieldRule}`,
      background: vars.color.surface,
      ':hover': {
        background: vars.color.tint,
      },
      selectors: {
        '&[data-disabled=true]': {
          color: vars.color.ink3,
          backgroundColor: vars.color.surface,
          borderColor: vars.color.rule,
          cursor: 'not-allowed',
        },
      },
    },
  ],
  tertiary: [
    baseButton,
    {
      backgroundColor: 'transparent',
      ':hover': {
        background: vars.color.tint,
      },
      selectors: {
        '&[data-disabled=true]': {
          color: vars.color.ink3,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          cursor: 'not-allowed',
        },
      },
    },
  ],
  underlined: [
    baseButton,
    {
      padding: `${vars.space.s2} 0`,
      backgroundColor: 'transparent',
      borderRadius: 0,
      color: vars.color.ink3,
      cursor: 'pointer',
      borderBottom: `1px solid transparent`,
      ':hover': {
        color: vars.color.ink,
      },
      ':active': {
        borderBottomColor: vars.color.ink,
      },
      selectors: {
        '&[data-disabled=true]': {
          color: vars.color.ink3,
          backgroundColor: 'transparent',
          borderBottomColor: vars.color.ink3,
          cursor: 'not-allowed',
        },
      },
    },
  ],
});
