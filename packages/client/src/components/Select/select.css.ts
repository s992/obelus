import { globalStyle, style } from '@vanilla-extract/css';

import { flex, sectionDivider, typography, vars } from '@/style';

export const button = style([
  flex.container,
  typography.body,
  {
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'left',
    cursor: 'pointer',
    gap: vars.space.s3,
    padding: `${vars.space.s3} ${vars.space.s4}`,
    borderRadius: vars.radius.sm,
    width: '100%',
    transition: 'border-color .15s',
    border: `1px solid ${vars.color.fieldRule}`,
    background: vars.color.surface,
    selectors: {
      '&[data-focus-visible=true], &[aria-expanded=true]': {
        borderColor: vars.color.ink,
      },
    },
  },
]);

export const chevron = style({
  width: 14,
  height: 14,
  color: vars.color.ink3,
  flexShrink: 0,
  transition: 'transform .15s, color .15s',
});

globalStyle(`${button}[aria-expanded=true] ${chevron}`, {
  transform: 'rotate(180deg)',
});

globalStyle(`${button}:where(:hover, [data-focus-visible=true], [aria-expanded=true]) ${chevron}`, {
  color: vars.color.ink,
});

export const popover = style({
  padding: 0,
});

export const listBoxItem = style([
  flex.container,
  typography.body,
  {
    alignItems: 'center',
    gap: vars.space.s3,
    padding: `${vars.space.s3} ${vars.space.s4}`,
    background: 'transparent',
    borderBottom: sectionDivider,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color .15s, color .15s',
    width: '100%',
    selectors: {
      '&:last-child': {
        borderBottomColor: 'transparent',
      },
      '&:hover, &[data-selected=true], &[data-focus-visible=true]': {
        background: vars.color.tint,
      },
      '&[data-selected=true]': {
        boxShadow: `inset 2px 0 0 ${vars.color.accent}`,
      },
    },
  },
]);
