import { style, styleVariants } from '@vanilla-extract/css';

import {
  BOOK_COVER_LARGE_WIDTH,
  BOOK_COVER_MEDIUM_WIDTH,
  BOOK_COVER_XLARGE_WIDTH,
  typography,
  vars,
} from '../../style';

const baseCover = style({
  aspectRatio: '2 / 3',
  borderRadius: vars.radius.cover,
  maxWidth: '100%',
});

export const cover = styleVariants({
  medium: [baseCover, { width: BOOK_COVER_MEDIUM_WIDTH }],
  large: [baseCover, { width: BOOK_COVER_LARGE_WIDTH }],
  xlarge: [baseCover, { width: BOOK_COVER_XLARGE_WIDTH }],
});

export const placeholderCover = style({
  border: `1px solid ${vars.color.fieldRule}`,
  background: `repeating-linear-gradient(135deg, transparent 0 6px, ${vars.color.tint} 6px 7px), ${vars.color.surface}`,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: vars.space.s2,
  overflow: 'hidden',
});

export const title = style([typography.coverTitle, { maxHeight: '70%', overflow: 'clip' }]);

export const author = style([typography.coverLabel]);
