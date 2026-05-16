import { globalStyle, style } from '@vanilla-extract/css';

import { mediaQuery, typography, vars } from '../../../style';

const GRID_TEMPLATE_COLUMNS = '56px 1fr 0.5fr 0.5fr';
const HEADER_HEIGHT = 24;

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s5,
});

export const resultContainer = style({
  overflowY: 'auto',
  maxHeight: 'calc(var(--visual-viewport-height) * 0.5)',
  '@media': {
    [mediaQuery.search]: {
      maxHeight: 'calc(var(--visual-viewport-height) * 0.7)',
    },
  },
});

export const resultHeader = style([
  typography.label,
  {
    display: 'grid',
    gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
    gap: vars.space.s4,
    position: 'sticky',
    top: 0,
    background: vars.color.bg,
    height: HEADER_HEIGHT,
  },
]);

export const gridRow = style([
  typography.body,
  {
    display: 'grid',
    gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
    gap: vars.space.s4,
    padding: `${vars.space.s2} 0`,
    scrollMarginTop: HEADER_HEIGHT,
    cursor: 'pointer',
  },
]);

globalStyle(
  `${container}[data-modality=mouse] ${gridRow}:hover, ${container}[data-modality=keyboard] ${gridRow}:focus`,
  {
    background: vars.color.tint,
  },
);
