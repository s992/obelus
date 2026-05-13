import { style } from '@vanilla-extract/css';

import { typography, vars } from '../../style';

export const container = style({
  display: 'grid',
  gridTemplateColumns: '220px 1fr',
  gap: vars.space.s7,
});

export const sidebar = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s6,
  position: 'sticky',
  top: 32,
  alignSelf: 'start',
});

export const coverWrapper = style({
  display: 'flex',
  justifyContent: 'center',
});

export const meta = style({
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s3,
  paddingTop: vars.space.s4,
  borderTop: `1px solid ${vars.color.rule}`,
});

export const metaRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: vars.space.s2,
});

export const header = style({
  paddingBottom: vars.space.s6,
  borderBottom: `1px solid ${vars.color.rule}`,
});

export const title = style([
  typography.display,
  {
    marginBottom: vars.space.s2,
  },
]);

export const author = style({
  fontFamily: vars.font.body,
  fontSize: '14px',
  color: vars.color.ink3,
  letterSpacing: vars.letterSpacing.label,
  textTransform: 'uppercase',
  marginBottom: vars.space.s1,
});

export const seriesLink = style({
  fontFamily: vars.font.body,
  fontSize: '12px',
  color: vars.color.ink3,
  letterSpacing: vars.letterSpacing.label,
  margin: 0,
});

export const description = style([
  typography.body,
  {
    textWrap: 'wrap',
  },
]);

export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
});
