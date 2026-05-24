import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '@/style';
import { typography } from '@/style/typography.css';

const baseButton = style([
  typography.body,
  {
    display: 'flex',
    justifyContent: 'center',
    borderRadius: vars.radius.sm,
    padding: `${vars.space.s2} ${vars.space.s4}`,
    transition: 'background-color .15s ease, border-color .15s ease',
    width: 'fit-content',
    selectors: {
      '&[data-focus-visible=true]': {
        outline: `1px solid ${vars.color.accent}`,
        outlineOffset: 2,
      },
    },
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
  link: [
    baseButton,
    {
      padding: `${vars.space.s2} 0`,
      backgroundColor: 'transparent',
      borderRadius: 0,
      color: vars.color.ink3,
      cursor: 'pointer',
      borderBottom: 'none',
      textDecoration: 'underline',
      textDecorationColor: 'transparent',
      textUnderlineOffset: vars.space.s2,
      ':hover': {
        color: vars.color.ink,
        textDecorationColor: vars.color.accent,
      },
      selectors: {
        '&.active': {
          textDecorationColor: vars.color.accent,
        },
        '&[data-disabled=true]': {
          color: vars.color.ink3,
          backgroundColor: 'transparent',
          cursor: 'not-allowed',
        },
        '&[data-focus-visible=true]': {
          outline: 'none',
          textDecorationColor: vars.color.accent,
        },
      },
    },
  ],
  chip: [
    typography.uppercaseLabel,
    {
      display: 'inline-flex',
      alignItems: 'center',
      gap: vars.space.s2,
      padding: `${vars.space.s2} ${vars.space.s3}`,
      border: `1px solid ${vars.color.fieldRule}`,
      borderRadius: vars.radius.pill,
      background: 'transparent',
      cursor: 'pointer',
      transition: 'color .15s, border-color .15s',
      ':hover': {
        color: vars.color.ink,
      },
      ':active': {
        color: vars.color.ink,
        borderColor: vars.color.ink,
      },
      selectors: {
        '&[data-selected=true], &[data-focus-visible=true]': {
          color: vars.color.ink,
          borderColor: vars.color.ink,
        },
      },
    },
  ],
});
