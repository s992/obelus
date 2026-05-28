import { style, styleVariants } from '@vanilla-extract/css';

import { flex, typography, vars } from '@/style';

export const filterBar = style([
  flex.container,
  {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: vars.space.s2,
    marginBottom: vars.space.s5,
  },
]);

const baseLink = style([
  typography.monoBody,
  {
    color: vars.color.ink3,
  },
]);

export const link = styleVariants({
  default: [baseLink],
  invalidated: [baseLink, { textDecoration: 'line-through' }],
});

export const activeLinkToken = style({
  color: vars.color.ink,
});

export const linkContainer = style([
  flex.container,
  {
    alignItems: 'center',
    gap: vars.space.s3,
  },
]);

const baseStatusCell = style([typography.uppercaseLabel]);

export const statusCell = styleVariants({
  active: [baseStatusCell, { color: vars.color.good }],
  invalidated: [baseStatusCell, { color: vars.color.bad }],
  used: [baseStatusCell],
});

export const actionContainer = style([
  flex.container,
  {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'nowrap',
    gap: vars.space.s5,
  },
]);

export const header = {
  link: style({ width: '41%' }),
  expiry: style({ width: '24%' }),
  status: style({ width: '16%' }),
  action: style({ textAlign: 'right' }),
};
