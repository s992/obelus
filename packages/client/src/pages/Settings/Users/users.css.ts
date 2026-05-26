import { style, styleVariants } from '@vanilla-extract/css';

import { flex, typography, vars } from '@/style';

export const filterBar = style([
  flex.container,
  {
    alignItems: 'center',
    gap: vars.space.s7,
    marginBottom: vars.space.s5,
  },
]);

export const filterGroup = style([
  flex.container,
  {
    alignItems: 'center',
    gap: vars.space.s4,
  },
]);

export const nameCell = style([
  typography.display,
  {
    fontSize: vars.fontSize.title,
  },
]);

const baseRoleCell = style([
  typography.uppercaseLabel,
  {
    color: vars.color.ink2,
  },
]);

export const roleCell = styleVariants({
  admin: [baseRoleCell, { color: vars.color.ink }],
  member: [baseRoleCell],
});

const baseStatusCell = style([baseRoleCell]);

export const statusCell = styleVariants({
  active: [baseStatusCell, { color: vars.color.good }],
  pending_approval: [baseStatusCell, { color: vars.color.warn }],
  disabled: [baseStatusCell, { color: vars.color.bad }],
});

export const dateCell = style([
  typography.label,
  {
    color: vars.color.ink2,
  },
]);

export const emptyStateCell = style([
  typography.body,
  {
    textAlign: 'center',
  },
]);

export const header = {
  userName: style({ width: '30%' }),
  role: style({ width: '13%' }),
  status: style({ width: '13%' }),
  joined: style({ width: '17%' }),
  action: style({ textAlign: 'right' }),
};

export const actionContainer = style([
  flex.container,
  {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'nowrap',
    gap: vars.space.s4,
  },
]);
