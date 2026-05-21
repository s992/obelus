import { style } from '@vanilla-extract/css';

import { vars } from './contract.css';

const display = style({
  fontSize: vars.fontSize.display,
  lineHeight: vars.lineHeight.tight,
  letterSpacing: vars.letterSpacing.display,
  fontFamily: vars.font.display,
  color: vars.color.ink,
  fontWeight: vars.fontWeight.display,
});

const h1 = style({
  fontSize: vars.fontSize.h1,
  lineHeight: vars.lineHeight.tight,
  letterSpacing: vars.letterSpacing.display,
  fontFamily: vars.font.display,
  color: vars.color.ink,
});

const h2 = style({
  fontSize: vars.fontSize.h2,
  lineHeight: vars.lineHeight.tight,
  letterSpacing: vars.letterSpacing.display,
  fontFamily: vars.font.display,
  color: vars.color.ink,
});

const title = style({
  fontSize: vars.fontSize.title,
  lineHeight: vars.lineHeight.tight,
  letterSpacing: vars.letterSpacing.display,
  fontFamily: vars.font.display,
  color: vars.color.ink,
});

const body = style({
  fontSize: vars.fontSize.body,
  lineHeight: vars.lineHeight.normal,
  letterSpacing: vars.letterSpacing.display,
  fontFamily: vars.font.body,
  color: vars.color.ink,
});

export const labelBase = {
  fontSize: vars.fontSize.label,
  lineHeight: vars.lineHeight.normal,
  letterSpacing: vars.letterSpacing.label,
  fontFamily: vars.font.mono,
  color: vars.color.ink3,
};

const label = style(labelBase);

const uppercaseLabel = style([label, { textTransform: 'uppercase' } as const]);

export const typography = {
  display,
  h1,
  h2,
  title,
  body,
  label,
  uppercaseLabel,
};
