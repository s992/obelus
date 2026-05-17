import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { flex, typography, vars } from '../../style';

export const field = style([
  flex.container,
  {
    alignItems: 'center',
    position: 'relative',
  },
]);

export const input = style([
  typography.body,
  {
    border: `1px solid ${vars.color.fieldRule}`,
    background: vars.color.surface,
    borderRadius: vars.radius.sm,
    padding: `${vars.space.s3} ${vars.space.s7} ${vars.space.s3} ${vars.space.s4}`,
    transition: 'border-color .15s ease;',
    ':hover': {
      borderColor: vars.color.ink,
    },
    selectors: {
      '&[data-focus-within]': {
        borderColor: vars.color.ink,
      },
    },
  },
]);

export const button = style({
  marginLeft: calc(vars.space.s6).add(vars.space.s2).negate().toString(),
});

export const dateSegment = style({
  padding: vars.space.s1,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'end',
  borderRadius: vars.radius.sm,
  selectors: {
    '&[data-placeholder]': {
      color: vars.color.ink3,
    },
    '&:focus': {
      color: vars.color.surface,
      background: vars.color.ink2,
    },
  },
});
