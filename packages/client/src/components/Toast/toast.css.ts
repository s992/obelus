import { createViewTransition, globalStyle, keyframes, style } from '@vanilla-extract/css';

import { flex, vars } from '../../style';

const slideOut = keyframes({
  to: {
    translate: '100% 0',
    opacity: 0,
    visibility: 'hidden',
  },
});

const slideIn = keyframes({
  from: {
    translate: '100% 0',
    opacity: 0,
  },
});

const toastTransition = createViewTransition();

globalStyle(`::view-transition-new(${toastTransition}):only-child`, {
  animation: `${slideIn} 400ms`,
});

globalStyle(`::view-transition-old(${toastTransition}):only-child`, {
  animation: `${slideOut} 400ms`,
  animationFillMode: 'forwards',
});

export const toastRegion = style([
  flex.container,
  {
    position: 'fixed',
    bottom: vars.space.s4,
    right: vars.space.s4,
    flexDirection: 'column-reverse',
    gap: vars.space.s2,
    outline: 'none',
  },
]);

export const toast = style({
  position: 'relative',
  width: 440,
});

export const closeButton = style({
  position: 'absolute',
  top: vars.space.s1,
  right: vars.space.s1,
});
