import { style } from '@vanilla-extract/css';

import { button } from '../../components/Button/button.css';
import { mediaQuery, typography, vars } from '../../style';

export const tabContainer = style({
  width: '50%',
  margin: '0 auto',
  paddingTop: vars.space.s7,
  '@media': {
    [mediaQuery.mobile]: {
      width: '100%',
    },
  },
});

export const tabContent = style({
  padding: `${vars.space.s5} 0`,
});

export const tabList = style({
  display: 'flex',
  gap: vars.space.s4,
  borderBottom: `1px solid ${vars.color.rule}`,
});

export const tab = style([
  button.underlined,
  {
    textDecoration: 'none',
    selectors: {
      '&[data-selected=true]': {
        borderBottom: `1px solid ${vars.color.ink2}`,
      },
    },
  },
]);

export const formContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s4,
});

export const userNameHighlight = style([
  typography.label,
  {
    background: vars.color.tint,
    padding: '1px 5px',
    borderRadius: vars.radius.sm,
  },
]);
