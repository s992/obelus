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

export const gridCell = style([
  flex.center,
  {
    textAlign: 'center',
    width: 35,
    height: 32,
    borderRadius: vars.radius.sm,
    cursor: 'pointer',
    selectors: {
      '&[data-disabled]': {
        visibility: 'hidden',
      },
      '&[data-selected]': {
        background: vars.color.ink,
        color: vars.color.bg,
      },
      '&:hover:not([data-disabled], [data-selected]), &[data-focus-visible=true]:not([data-disabled], [data-selected])':
        {
          background: vars.color.tint,
        },
      '&:where([data-focus-visible=true][data-selected]):not([data-disabled])': {
        background: vars.color.tint,
        color: vars.color.ink,
      },
    },
  },
]);
