import { style } from '@vanilla-extract/css';

import { mediaQuery, sectionDivider, vars } from '../../style';
import { NAV_WIDTH, NAV_Z_INDEX, SWIPE_TRIGGER_WIDTH } from './constants';

export const navDragTrigger = style({
  position: 'fixed',
  top: 0,
  right: 0,
  width: SWIPE_TRIGGER_WIDTH,
  height: '100%',
  zIndex: NAV_Z_INDEX - 1,
  touchAction: 'none',
  '@media': {
    [mediaQuery.mobileUp]: {
      display: 'none',
    },
  },
});

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
      width: NAV_WIDTH,
      zIndex: NAV_Z_INDEX,
    },
  },
});

export const searchButton = style({
  transform: 'translateY(2px)', // better horizontal alignment
  '@media': {
    [mediaQuery.mobile]: {
      display: 'none',
    },
  },
});

export const mobileButtons = style({
  '@media': {
    [mediaQuery.mobileUp]: {
      display: 'contents',
    },
  },
});

export const mobileSearchButton = style({
  '@media': {
    [mediaQuery.mobileUp]: {
      display: 'none',
    },
  },
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
