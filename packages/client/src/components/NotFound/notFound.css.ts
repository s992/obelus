import { style } from '@vanilla-extract/css';

import { flex, mediaQuery, sectionDivider, typography, vars } from '@/style';

export const container = style({ display: 'grid', placeItems: 'center', padding: vars.space.s7, flex: 1 });

export const stage = style({
  width: '100%',
  maxWidth: 920,
  display: 'grid',
  gridTemplateColumns: '1.05fr 1fr',
  gap: vars.space.s7,
  alignItems: 'center',
  '@media': {
    [mediaQuery.mobile]: {
      display: 'flex',
    },
  },
});

export const copy = style([
  flex.column,
  {
    gap: vars.space.s4,
  },
]);

export const eyebrow = style([
  typography.uppercaseLabel,
  {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: vars.space.s2,
  },
]);

export const error = style({
  color: vars.color.bad,
  border: `1px solid color-mix(in oklab, ${vars.color.bad} 40%, ${vars.color.rule})`,
  background: `color-mix(in oklab, ${vars.color.bad} 6%, ${vars.color.surface})`,
  padding: `1px ${vars.space.s2}`,
  borderRadius: vars.radius.pill,
});

export const h1 = style([
  typography.body,
  {
    margin: 0,
    fontSize: '96px',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    color: vars.color.ink,
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 2,
  },
]);

export const strike = style({
  position: 'relative',
  selectors: {
    '&::after': {
      content: '',
      position: 'absolute',
      left: -4,
      right: -4,
      top: '56%',
      height: 2,
      background: vars.color.bad,
      transform: 'rotate(-8deg)',
    },
  },
});

export const h2 = style([
  typography.body,
  {
    margin: 0,
    fontSize: '28px',
    lineHeight: '1.15',
    color: vars.color.ink,
    textWrap: 'balance',
  },
]);

export const message = style([
  typography.body,
  {
    color: vars.color.ink2,
  },
]);

export const badUrl = style([
  typography.label,
  {
    fontSize: '12px',
    color: vars.color.ink,
    background: vars.color.tint,
    borderRadius: vars.radius.sm,
    padding: `1px ${vars.space.s2}`,
  },
]);

export const card = style({
  border: sectionDivider,
  borderRadius: vars.radius.sm,
  background: vars.color.surface,
  padding: vars.space.s5,
  boxShadow: `0 1px 0 ${vars.color.rule}, 0 12px 28px -16px rgba(20, 20, 15, 0.10)`,
  transform: 'rotate(-1.2deg)',
  transition: 'transform .35s ease',
  position: 'relative',
  ':hover': {
    transform: 'rotate(0deg)',
  },
  '@media': {
    [mediaQuery.mobile]: {
      display: 'none',
    },
  },
});

export const stamp = style([
  typography.uppercaseLabel,
  {
    position: 'absolute',
    top: 14,
    right: -10,
    color: vars.color.bad,
    border: `1.5px solid ${vars.color.bad}`,
    borderRadius: '2px',
    padding: `${vars.space.s1} 8px`,
    background: `color-mix(in oklab, ${vars.color.bad} 5%, ${vars.color.surface})`,
    transform: 'rotate(8deg)',
    opacity: 0.85,
  },
]);

export const cardHeader = style([
  flex.container,
  {
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingBottom: vars.space.s3,
    borderBottom: sectionDivider,
    marginBottom: vars.space.s3,
  },
]);

export const cardValue = style([
  typography.body,
  {
    wordBreak: 'break-word',
  },
]);

export const cardValueStrike = style([
  cardValue,
  {
    textDecoration: 'line-through',
    textDecorationColor: vars.color.bad,
    textDecorationThickness: 1.5,
    color: vars.color.ink2,
  },
]);

export const cardValueEmphasis = style([
  cardValue,
  {
    color: vars.color.ink3,
  },
]);

export const cardRow = style({
  display: 'grid',
  gridTemplateColumns: '88px 1fr',
  gap: vars.space.s3,
  alignItems: 'baseline',
  padding: '6px 0',
  borderBottom: `1px dashed ${vars.color.rule}`,
  selectors: {
    '&:nth-of-type(6)': {
      borderBottom: 'none',
    },
  },
});

export const cardFooter = style([
  flex.container,
  typography.uppercaseLabel,
  {
    marginTop: vars.space.s4,
    paddingTop: vars.space.s4,
    borderTop: sectionDivider,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
]);

export const cardFooterStrong = style({
  color: vars.color.ink,
});
