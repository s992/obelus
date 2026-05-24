import { style } from '@vanilla-extract/css';

import { vars } from '@/style';

export const toggle = style({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  userSelect: 'none',
});

export const track = style({
  width: 56,
  height: 30,
  borderRadius: vars.radius.pill,
  position: 'relative',
  flexShrink: 0,
  transition: 'background 0.25s ease',
  border: `1px solid ${vars.color.fieldRule}`,
  backgroundColor: vars.color.bg,
});

export const thumb = style({
  position: 'absolute',
  inset: '2px 0 0 2px',
  width: 24,
  height: 24,
  borderRadius: '50%',
  background: vars.color.bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.ink,
  transition: 'transform 0.25s ease',
});

export const darkPosition = style({
  transform: 'translateX(26px)',
});
