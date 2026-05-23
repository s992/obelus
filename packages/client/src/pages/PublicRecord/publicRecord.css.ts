import { style } from '@vanilla-extract/css';

import { flex, mediaQuery, sectionDivider, typography, vars } from '../../style';

export const headerContainer = style({
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: vars.space.s3,
});

export const headerSeparator = style({
  color: vars.color.ink3,
});

export const identity = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: vars.space.s7,
  alignItems: 'end',
  paddingBottom: vars.space.s6,
  marginBottom: vars.space.s6,
  borderBottom: sectionDivider,
});

export const bio = style([
  typography.body,
  {
    color: vars.color.ink2,
    marginTop: vars.space.s4,
  },
]);

export const meta = style([
  flex.column,
  typography.uppercaseLabel,
  {
    gap: vars.space.s2,
    textAlign: 'right',
    '@media': {
      [mediaQuery.mobile]: {
        alignSelf: 'center',
      },
    },
  },
]);

export const metaRow = style({
  display: 'inline-flex',
  justifyContent: 'flex-end',
  gap: vars.space.s3,
});

export const metaValue = style({ color: vars.color.ink });

export const footer = style([
  flex.container,
  typography.uppercaseLabel,
  {
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: vars.space.s7,
    paddingTop: vars.space.s5,
    borderTop: sectionDivider,
    '@media': {
      [mediaQuery.mobile]: {
        flexDirection: 'column-reverse',
        alignItems: 'center',
        gap: vars.space.s2,
      },
    },
  },
]);

export const obelusLink = style({
  color: vars.color.ink2,
  textDecoration: 'none',
  borderBottom: '1px solid transparent',
  transition: 'border .15s, color .15s',
  ':hover': {
    color: vars.color.ink,
    borderBottomColor: vars.color.ink2,
  },
});

export const tabs = style({});

export const tabList = style([
  flex.container,
  {
    gap: vars.space.s6,
    borderBottom: sectionDivider,
    marginBottom: vars.space.s6,
  },
]);

export const tab = style([
  typography.body,
  {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: vars.space.s2,
    borderBottom: `1px solid transparent`,
    marginBottom: -1,
    padding: `${vars.space.s3} 0`,
    cursor: 'pointer',
    color: vars.color.ink3,
    transition: 'color .15s, border-color .15s',
    selectors: {
      '&[data-selected=true]': {
        color: vars.color.ink,
        borderBottomColor: vars.color.ink,
      },
    },
  },
]);

export const tabLabelCount = style([
  typography.label,
  {
    color: vars.color.ink2,
  },
]);

export const tabPanel = style({
  position: 'relative',
  minHeight: 100,
});
