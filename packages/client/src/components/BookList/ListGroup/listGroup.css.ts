import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

import { flex, mediaQuery, typography, vars } from '../../../style';

export const group = style({
  display: 'grid',
  gridTemplateColumns: '96px 1fr',
  gap: vars.space.s5,
  padding: `${vars.space.s5} 0`,
  borderTop: `1px solid ${vars.color.rule}`,
  '@media': {
    [mediaQuery.mobile]: {
      gridTemplateColumns: '1fr',
      gap: vars.space.s3,
      padding: `${vars.space.s4} 0`,
    },
  },
});

export const gutter = style([
  flex.column,
  {
    gap: vars.space.s1,
    alignSelf: 'start',
    position: 'sticky',
    top: vars.space.s5,
    '@media': {
      [mediaQuery.mobile]: {
        position: 'static',
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: vars.space.s3,
        borderBottom: `1px solid ${vars.color.rule}`,
      },
    },
  },
]);

const gutterDate = style([
  typography.label,
  {
    textTransform: 'uppercase',
  },
]);

export const gutterMonth = style([gutterDate, { color: vars.color.ink2 }]);

export const gutterYear = style([gutterDate, { color: vars.color.ink3 }]);

export const gutterCount = style([
  typography.label,
  {
    color: vars.color.ink3,
    marginTop: vars.space.s2,
  },
]);

export const listRow = style({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '64px 1fr',
  gap: vars.space.s6,
  padding: `${vars.space.s5} 0`,
  borderTop: `1px solid ${vars.color.rule}`,
  selectors: {
    '&:first-child': {
      borderTop: 0,
      paddingTop: 0,
    },
  },
  '@media': {
    [mediaQuery.mobile]: {
      gridTemplateColumns: '52px 1fr',
      gap: vars.space.s5,
      padding: `${vars.space.s4} 0`,
    },
  },
});

const baseJudgmentAccent = style({
  position: 'absolute',
  left: -10,
  top: vars.space.s5,
  bottom: vars.space.s5,
  width: 2,
  borderRadius: '2px',
  background: vars.color.ink3,
});

export const judgmentAccent = styleVariants({
  accepted: [baseJudgmentAccent, { background: vars.color.good }],
  mixed: [baseJudgmentAccent, { background: vars.color.warn }],
  rejected: [baseJudgmentAccent, { background: vars.color.bad }],
  undecided: [baseJudgmentAccent],
});

globalStyle(`${listRow}:first-child ${baseJudgmentAccent}`, {
  top: 0,
});

export const listEntry = style([
  flex.column,
  {
    gap: vars.space.s2,
    minWidth: 0,
  },
]);

export const titleAndAuthor = style([
  flex.column,
  {
    gap: '2px',
    minWidth: 0,
  },
]);

export const title = style([
  typography.display,
  {
    fontSize: vars.fontSize.title,
    color: vars.color.ink,
    textDecoration: 'none',
    cursor: 'pointer',
    textWrap: 'pretty',
    width: 'fit-content',
    ':hover': {
      textDecoration: 'underline',
      textDecorationColor: vars.color.ink3,
      textUnderlineOffset: vars.space.s1,
    },
  },
]);

export const author = style([
  typography.body,
  {
    color: vars.color.ink2,
  },
]);
