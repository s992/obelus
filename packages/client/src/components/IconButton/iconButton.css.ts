import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

import { vars } from '../../style';

const baseButton = style({
  appearance: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  padding: 0,
  border: '1px solid transparent',
  borderRadius: vars.radius.sm,
  transition: 'background-color .15s ease, border-color .15s ease, color .15s ease',
});

export const button = styleVariants({
  tertiary: [
    baseButton,
    {
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      color: vars.color.ink2,
      ':hover': {
        backgroundColor: vars.color.tint,
        color: vars.color.ink,
      },
    },
  ],
});

globalStyle(`${baseButton} svg`, {
  width: 16,
  height: 16,
});
