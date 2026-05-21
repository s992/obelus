import { globalStyle, style } from '@vanilla-extract/css';

import { flex, mediaQuery, sectionDivider, typography, vars } from '../../style';

export const container = style({
  display: 'grid',
  gridTemplate: 'auto 1fr / repeat(2, 1fr)',
  gap: vars.space.s6,
  '@media': {
    [mediaQuery.mobile]: {
      display: 'flex',
      flexDirection: 'column',
    },
  },
});

export const section = style([
  flex.column,
  {
    gap: vars.space.s5,
    padding: vars.space.s5,
    background: vars.color.surface,
    border: sectionDivider,
  },
]);

export const publicUrlSection = style([
  section,
  {
    '@media': {
      [mediaQuery.mobile]: {
        gridRowStart: 2,
      },
    },
  },
]);

export const importsSection = style([
  section,
  {
    gridColumn: 'span 2 / span 2',
    gridRowStart: 2,
    '@media': {
      [mediaQuery.mobile]: {
        gridRowStart: 3,
      },
    },
  },
]);

export const privacyButton = style({
  display: 'inline-flex',
});

export const recordUrlContainer = style([
  flex.container,
  {
    gap: vars.space.s3,
    alignItems: 'center',
    wordBreak: 'break-all',
  },
]);

export const importSection = style([
  flex.column,
  {
    gap: vars.space.s6,
  },
]);

export const dropZone = style({
  width: '100%',
  height: 190,
  border: `1px solid ${vars.color.fieldRule}`,
  position: 'relative',
  background: vars.color.tint,
});

export const dropZoneButton = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  cursor: 'pointer',
  position: 'absolute',
  inset: vars.space.s2,
  background: vars.color.bg,
  border: sectionDivider,
  gap: vars.space.s3,
  selectors: {
    '&:hover': {
      background: vars.color.tint,
    },
  },
});

globalStyle(`${dropZone}[data-drop-target] ${dropZoneButton}`, {
  background: vars.color.tint,
  borderColor: vars.color.ink,
});

export const importSectionHeader = style([
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

export const importSectionHeaderH3 = style([
  typography.body,
  {
    textTransform: 'uppercase',
    color: vars.color.ink3,
    fontWeight: '500',
  },
]);

export const importSectionHeaderMeta = style({
  color: vars.color.ink3,
  '@media': {
    [mediaQuery.mobile]: {
      display: 'none',
    },
  },
});

export const importSectionRow = style({
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

export const importSectionMetricContainer = style([
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

export const importSectionMetric = style([
  typography.title,
  {
    fontSize: '22px',
  },
]);

export const importSectionMetricLabel = style([typography.label]);

export const disclosure = style({
  marginBottom: vars.space.s6,
  paddingBottom: vars.space.s6,
  borderBottom: `0.5px solid ${vars.color.rule}`,
});

export const disclosureButton = style([
  flex.container,
  {
    background: 'transparent',
    width: '100%',
    justifyContent: 'space-between',
    ':hover': {
      background: vars.color.tint,
      cursor: 'pointer',
    },
  },
]);

export const importSectionDate = style({
  '@media': {
    [mediaQuery.mobile]: {
      gridColumn: 'span 2 / span 2',
    },
  },
});

export const importSectionExpandIcon = style([
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
