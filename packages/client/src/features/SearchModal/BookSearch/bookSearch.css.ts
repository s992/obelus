import { style } from '@vanilla-extract/css';

import { flex, mediaQuery, sectionDivider, typography, vars } from '../../../style';

export const resultContainer = style({
  display: 'grid',
  gridTemplateColumns: '1fr 300px',
  minHeight: 440,
  '@media': {
    [mediaQuery.tablet]: {
      gridTemplateColumns: '1fr',
    },
  },
});

export const scrollContainer = style({
  padding: `${vars.space.s2} ${vars.space.s3}`,
  borderRight: sectionDivider,
  maxHeight: 500,
  overflowY: 'auto',
});

export const preview = style([
  flex.column,
  {
    padding: vars.space.s5,
    gap: vars.space.s5,
    background: vars.color.bg,
    '@media': {
      [mediaQuery.tablet]: {
        display: 'none',
      },
    },
  },
]);

export const row = style({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '40px 1fr auto',
  alignItems: 'center',
  gap: vars.space.s6,
  padding: `${vars.space.s3} ${vars.space.s4}`,
  borderRadius: vars.radius.sm,
  background: 'transparent',
  cursor: 'pointer',
  transition: 'background-color .15s',
  selectors: {
    '&[aria-selected=true]': {
      background: vars.color.tint,
    },
  },
});

export const rowBar = style({
  position: 'absolute',
  top: 8,
  bottom: 8,
  left: 0,
  width: 2,
  background: vars.color.ink,
  borderRadius: vars.radius.sm,
});

export const titleAuthorStack = style([
  flex.column,
  {
    gap: vars.space.s1,
    minWidth: 0,
  },
]);

export const title = style([
  typography.title,
  {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
]);

export const authorPublished = style([
  flex.container,
  typography.body,
  {
    alignItems: 'baseline',
    gap: vars.space.s2,
    color: vars.color.ink2,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
]);

export const status = style([
  typography.uppercaseLabel,
  {
    textAlign: 'right',
    minWidth: 60,
  },
]);

export const footer = style([
  flex.container,
  typography.uppercaseLabel,
  {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${vars.space.s4} ${vars.space.s5}`,
    borderTop: sectionDivider,
  },
]);

export const shortcuts = style([
  flex.container,
  {
    gap: vars.space.s5,
    alignItems: 'center',
  },
]);

export const shortcutSegment = style([
  flex.container,
  {
    gap: vars.space.s2,
    alignItems: 'center',
    lineHeight: 1,
  },
]);

export const keyboard = style([
  flex.center,
  {
    display: 'inline-flex',
    minWidth: 18,
    height: 18,
    padding: `0 ${vars.space.s2}`,
    border: sectionDivider,
    background: vars.color.bg,
    color: vars.color.ink2,
    lineHeight: 1,
  },
]);

export const footerCount = style([
  typography.uppercaseLabel,
  {
    '@media': {
      [mediaQuery.mobile]: {
        display: 'none',
      },
    },
  },
]);
