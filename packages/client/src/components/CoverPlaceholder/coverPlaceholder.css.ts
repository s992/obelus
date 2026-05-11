import { style, styleVariants } from '@vanilla-extract/css';

import { BOOK_COVER_DEFAULT_WIDTH, BOOK_COVER_LARGE_WIDTH, typography, vars } from '../../style';

const baseCover = style({
  aspectRatio: '2 / 3',
  border: `1px solid ${vars.color.fieldRule}`,
  background: `repeating-linear-gradient(135deg, transparent 0 6px, ${vars.color.tint} 6px 7px), ${vars.color.surface}`,
  borderRadius: vars.radius.cover,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: vars.space.s2,
  overflow: 'hidden',
});

export const cover = styleVariants({
  default: [baseCover, { width: BOOK_COVER_DEFAULT_WIDTH }],
  large: [baseCover, { width: BOOK_COVER_LARGE_WIDTH }],
});

export const title = style([typography.coverTitle, { maxHeight: '70%', overflow: 'clip' }]);

export const author = style([typography.coverLabel]);
