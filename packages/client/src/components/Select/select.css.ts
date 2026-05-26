import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

import { flex, sectionDivider, typography, vars } from '@/style';

const baseButton = style([
  typography.body,
  {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'left',
    cursor: 'pointer',
    width: '100%',
  },
]);

export const button = styleVariants({
  default: [
    baseButton,
    {
      borderRadius: vars.radius.sm,
      transition: 'border-color .15s',
      border: `1px solid ${vars.color.fieldRule}`,
      gap: vars.space.s3,
      padding: `${vars.space.s3} ${vars.space.s4}`,
      background: vars.color.surface,
      selectors: {
        '&[data-focus-visible=true], &[aria-expanded=true]': {
          borderColor: vars.color.ink,
        },
      },
    },
  ],
  muted: [
    baseButton,
    {
      color: vars.color.ink3,
      padding: 0,
      gap: vars.space.s1,
      transition: 'color .15s',
      background: 'transparent',
      selectors: {
        '&:hover, &[data-focus-visible=true], &[aria-expanded=true]': {
          color: vars.color.ink,
        },
      },
    },
  ],
});

const baseChevron = style({
  color: vars.color.ink3,
  flexShrink: 0,
  transition: 'transform .15s, color .15s',
});

export const chevron = styleVariants({
  default: [baseChevron, { width: 14, height: 14 }],
  muted: [baseChevron, { width: 12, height: 12 }],
});

globalStyle(`${baseButton}[aria-expanded=true] ${baseChevron}`, {
  transform: 'rotate(180deg)',
});

globalStyle(`${baseButton}:where(:hover, [data-focus-visible=true], [aria-expanded=true]) ${baseChevron}`, {
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
