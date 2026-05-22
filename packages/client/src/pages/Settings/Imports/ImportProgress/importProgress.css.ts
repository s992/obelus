import { keyframes, style, styleVariants } from '@vanilla-extract/css';

import { flex, sectionDivider, typography, vars } from '../../../../style';

export const container = style([
  flex.column,
  {
    width: '75%',
    gap: vars.space.s3,
  },
]);

export const headerRow = style([
  flex.container,
  {
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: vars.space.s4,
  },
]);

export const headerLeft = style([
  flex.container,
  {
    alignItems: 'baseline',
    gap: vars.space.s3,
  },
]);

export const headerFileName = style([
  typography.display,
  {
    fontSize: vars.fontSize.title,
  },
]);

const pulseKeyframes = keyframes({
  '0%, 100%': {
    opacity: 0.35,
  },
  '50%': {
    opacity: 1,
  },
});

export const bullet = style({
  display: 'inline-block',
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: vars.color.ink,
  marginRight: 6,
  transform: 'translateY(-1px)',
});

export const pulse = style({
  animation: `${pulseKeyframes} 1.6s ease-in-out infinite`,
});

export const metaNumber = style({
  color: vars.color.ink,
});

export const metaNumberError = style({
  color: vars.color.bad,
});

export const bar = style([
  flex.container,
  {
    position: 'relative',
    height: 8,
    border: sectionDivider,
    borderRadius: vars.radius.sm,
    background: vars.color.surface,
    overflow: 'hidden',
  },
]);

const shimmerKeyframes = keyframes({
  '0%': {
    transform: 'translateX(-100%)',
  },
  '100%': {
    transform: 'translateX(100%)',
  },
});

const baseSegment = style({
  display: 'block',
  height: '100%',
});

export const segment = styleVariants({
  succeeded: [
    baseSegment,
    {
      background: vars.color.ink,
      selectors: {
        '&::after': {
          content: '',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(90deg, transparent 0%, color-mix(in oklab, ${vars.color.bg} 40%, transparent) 50%, transparent 100%)`,
          animation: `${shimmerKeyframes} 2.4s ease-in-out infinite`,
        },
      },
    },
  ],
  found: [
    baseSegment,
    {
      background: `color-mix(in oklab, ${vars.color.ink} 18%, ${vars.color.surface})`,
    },
  ],
  failed: [
    baseSegment,
    {
      background: `color-mix(in oklab, ${vars.color.bad} 50%, ${vars.color.surface})`,
    },
  ],
});

export const footerRow = style([
  typography.uppercaseLabel,
  flex.container,
  {
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: vars.space.s2,
  },
]);
