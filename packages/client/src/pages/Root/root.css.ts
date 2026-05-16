import { style } from '@vanilla-extract/css';

import { mediaQuery, typography, vars } from '../../style';

export const pageWrapper = style({
  backgroundColor: vars.color.bg,
});

export const container = style({
  maxWidth: '1280px',
  padding: vars.space.s7,
  minHeight: '100vh',
  margin: '0 auto',
});

export const headerContainer = style({
  display: 'flex',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${vars.color.rule}`,
  paddingBottom: vars.space.s4,
  marginBottom: vars.space.s6,
});

export const brand = style([
  typography.brand,
  {
    display: 'flex',
    alignItems: 'center',
    gap: vars.space.s4,
    textDecoration: 'none',
  },
]);

export const obelusMark = style({
  transform: 'translateY(-1px)',
});

export const navSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s5,
  '@media': {
    [mediaQuery.mobile]: {
      background: vars.color.bg,
      border: `1px solid ${vars.color.rule}`,
      flexDirection: 'column',
      insetBlock: 0,
      insetInlineEnd: 0,
      padding: vars.space.s4,
      position: 'fixed',
      transition: 'translate 0.25s ease',
      translate: '100% 0',
      width: 180,
      zIndex: 999,
    },
  },
});

export const navSectionOpen = style({
  translate: '0 0 !important',
});

export const searchButton = style({
  transform: 'translateY(2px)', // better horizontal alignment
});

export const navToggle = style({
  '@media': {
    [mediaQuery.mobileUp]: {
      display: 'none',
    },
    [mediaQuery.mobile]: {
      display: 'inline-flex',
    },
  },
});
