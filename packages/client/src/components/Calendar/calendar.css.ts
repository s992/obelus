import { globalStyle, style } from '@vanilla-extract/css';

import { flex, typography, vars } from '@/style';
import { labelBase } from '@/style/typography.css';

export const calendar = style([
  typography.body,
  flex.column,
  {
    width: 286,
    gap: vars.space.s3,
  },
]);

export const header = style([
  flex.container,
  {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
]);

export const currentMonthYear = style([
  flex.container,
  {
    gap: vars.space.s3,
    alignItems: 'baseline',
  },
]);

export const month = style([
  typography.body,
  {
    fontSize: '18px',
    fontWeight: '500',
  },
]);

export const year = style([
  typography.label,
  {
    color: vars.color.ink3,
  },
]);

export const headerButtonsContainer = style([
  flex.container,
  {
    gap: vars.space.s2,
  },
]);

export const calendarGrid = style({});

globalStyle(`${calendarGrid} th`, {
  ...labelBase,
  textTransform: 'uppercase',
});

globalStyle(`${calendarGrid} td`, {
  textAlign: 'center',
  width: 35,
  height: 32,
  borderRadius: vars.radius.sm,
  cursor: 'pointer',
});

globalStyle(`${calendarGrid} td[aria-disabled]`, {
  visibility: 'hidden',
});

globalStyle(`${calendarGrid} td[aria-selected]`, {
  background: vars.color.ink,
  color: vars.color.bg,
});

globalStyle(`${calendarGrid} td:hover:not([aria-disabled]):not([aria-selected])`, {
  background: vars.color.tint,
});
