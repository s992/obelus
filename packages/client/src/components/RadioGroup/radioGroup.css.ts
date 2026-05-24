import { globalStyle, style } from '@vanilla-extract/css';

import { flex, typography, vars } from '@/style';

export const radioGroup = style([
  flex.container,
  {
    gap: vars.space.s5,
    flexWrap: 'wrap',
  },
]);

export const radio = style([
  flex.container,
  typography.body,
  {
    appearance: 'none',
    borderRadius: '50%',
    position: 'relative',
    gap: vars.space.s2,
    color: vars.color.ink,
    width: 14,
    height: 14,
    border: `1px solid ${vars.color.fieldRule}`,
    background: vars.color.surface,
    transition: 'border-color .15s ease, background-color .15s ease',
  },
]);

export const radioLabel = style([
  flex.container,
  typography.body,
  {
    gap: vars.space.s2,
    alignItems: 'center',
  },
]);

globalStyle(`${radioLabel}[data-hovered] ${radio}`, {
  borderColor: vars.color.ink2,
});

globalStyle(`${radioLabel}[data-selected] ${radio}`, {
  borderColor: vars.color.ink,
});

globalStyle(`${radioLabel}[data-selected] ${radio}::after`, {
  content: '',
  position: 'absolute',
  inset: 2,
  borderRadius: '50%',
  background: vars.color.ink,
});

globalStyle(`${radioLabel}[data-focus-visible=true] ${radio}`, {
  outline: `1px solid ${vars.color.accent}`,
  outlineOffset: 2,
});
