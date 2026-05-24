import { style } from '@vanilla-extract/css';

import { vars } from '@/style';

export const container = style({
  display: 'inline-flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${vars.space.s3} ${vars.space.s1}`,
  paddingTop: vars.space.s2,
});

export const removeButton = style({
  ':hover': {
    color: vars.color.bad,
  },
  ':active': {
    borderBottomColor: vars.color.bad,
  },
});
