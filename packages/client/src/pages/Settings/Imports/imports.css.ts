import { globalStyle, style } from '@vanilla-extract/css';

import { flex, mediaQuery, sectionDivider, typography, vars } from '@/style';

export const dropZone = style({
  width: '100%',
  height: 190,
  border: `1px solid ${vars.color.fieldRule}`,
  position: 'relative',
  background: vars.color.tint,
});

export const innerDropZone = style([
  flex.center,
  {
    position: 'absolute',
    inset: vars.space.s2,
    background: vars.color.bg,
    border: sectionDivider,
    gap: vars.space.s3,
  },
]);

export const dropZoneButton = style([
  innerDropZone,
  {
    cursor: 'pointer',
    selectors: {
      '&:hover': {
        background: vars.color.tint,
      },
    },
  },
]);

globalStyle(`${dropZone}[data-drop-target] ${dropZoneButton}`, {
  background: vars.color.tint,
  borderColor: vars.color.ink,
});

export const sectionHeader = style([
  flex.container,
  typography.body,
  {
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: sectionDivider,
    marginBottom: vars.space.s4,
    paddingBottom: vars.space.s2,
    marginTop: vars.space.s7,
  },
]);

export const sectionHeaderH3 = style([
  typography.uppercaseLabel,
  {
    fontWeight: '500',
  },
]);

export const sectionHeaderMeta = style([
  flex.container,
  {
    alignItems: 'center',
    gap: vars.space.s2,
    color: vars.color.ink3,
    '@media': {
      [mediaQuery.mobile]: {
        display: 'none',
      },
    },
  },
]);

export const sectionRow = style({
  width: '100%',
  display: 'flex',
  gap: vars.space.s5,
  alignItems: 'baseline',
  '@media': {
    [mediaQuery.mobile]: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      alignItems: 'center',
    },
  },
});

export const sectionMetricContainer = style([
  flex.column,
  {
    gap: vars.space.s2,
    '@media': {
      [mediaQuery.mobile]: {
        gridRowStart: 2,
      },
    },
  },
]);

export const sectionMetric = style([
  typography.title,
  {
    fontSize: '22px',
  },
]);

export const disclosure = style({
  marginBottom: vars.space.s4,
  paddingBottom: vars.space.s4,
  borderBottom: `0.5px solid ${vars.color.rule}`,
});

export const disclosureButton = style([
  flex.container,
  {
    background: 'transparent',
    width: '100%',
    justifyContent: 'space-between',
    padding: `${vars.space.s4} ${vars.space.s2}`,
  },
]);

export const disclosureButtonHover = style({
  ':hover': {
    background: vars.color.tint,
    cursor: 'pointer',
  },
});

export const sectionDate = style({
  '@media': {
    [mediaQuery.mobile]: {
      gridColumn: 'span 2 / span 2',
    },
  },
});

export const sectionExpandIcon = style([
  flex.center,
  {
    color: vars.color.ink,
    '@media': {
      [mediaQuery.mobile]: {
        display: 'none',
      },
    },
  },
]);

export const code = style([
  typography.label,
  {
    fontSize: vars.fontSize.body,
    padding: `0 ${vars.space.s2}`,
    background: vars.color.tint,
    borderRadius: vars.radius.sm,
  },
]);
