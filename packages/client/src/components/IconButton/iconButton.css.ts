import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

import { vars } from '@/style';

const baseButton = style({
  appearance: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: '1px solid transparent',
  borderRadius: vars.radius.sm,
  transition: 'background-color .15s ease, border-color .15s ease, color .15s ease',
  selectors: {
    '&[data-focus-visible=true]': {
      outline: `1px solid ${vars.color.accent}`,
      outlineOffset: 2,
    },
  },
});

export const button = styleVariants({
  secondary: [
    baseButton,
    {
      border: `1px solid ${vars.color.fieldRule}`,
      background: vars.color.surface,
      selectors: {
        '&:hover:not([data-disabled=true])': {
          background: vars.color.tint,
        },
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
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      color: vars.color.ink2,
      selectors: {
        '&:hover:not([data-disabled=true])': {
          backgroundColor: vars.color.tint,
          color: vars.color.ink,
        },
        '&[data-disabled=true]': {
          color: vars.color.ink3,
          cursor: 'not-allowed',
        },
      },
    },
  ],
});

export const buttonSize = styleVariants({
  small: { width: 16, height: 16 },
  default: { width: 32, height: 32 },
});

globalStyle(`${buttonSize.default} svg`, {
  width: 16,
  height: 16,
});

globalStyle(`${buttonSize.small} svg`, {
  width: 14,
  height: 14,
});
