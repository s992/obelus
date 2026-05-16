import { keyframes, style } from '@vanilla-extract/css';

import { mediaQuery, vars } from '../../style';

const zoom = keyframes({
  '0%': { transform: 'scale(0.8)' },
  '100%': { transform: 'scale(1)' },
});

export const modal = style({
  position: 'sticky',
  maxHeight: 'calc(var(--visual-viewport-height) * 0.6)',
  top: '180px',
  marginLeft: '50vw',
  translate: '-50% 0%',
  padding: vars.space.s6,
  backgroundColor: vars.color.bg,
  border: `1px solid ${vars.color.rule}`,
  borderRadius: vars.radius.sm,
  selectors: {
    '&[data-entering]': {
      animation: `${zoom} 150ms ease`,
    },
  },
  '@media': {
    [mediaQuery.search]: {
      top: '90px',
      marginLeft: 40,
      translate: '-20px 0',
      maxHeight: 'calc(var(--visual-viewport-height) * 0.9)',
    },
  },
});
