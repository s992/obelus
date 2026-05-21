import { style } from '@vanilla-extract/css';

import { mediaQuery, sectionDivider, vars } from '../../style';

export const navSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s5,
  '@media': {
    [mediaQuery.mobile]: {
      background: vars.color.bg,
      border: sectionDivider,
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
