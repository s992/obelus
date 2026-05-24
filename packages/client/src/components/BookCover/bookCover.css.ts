import { style, styleVariants } from '@vanilla-extract/css';

import {
  BOOK_COVER_LARGE_WIDTH,
  BOOK_COVER_MEDIUM_WIDTH,
  BOOK_COVER_SMALL_WIDTH,
  BOOK_COVER_XLARGE_WIDTH,
  typography,
  vars,
} from '@/style';

const baseCover = style({
  aspectRatio: '2 / 3',
  borderRadius: vars.radius.cover,
  maxWidth: '100%',
});

export const cover = styleVariants({
  small: [baseCover, { minWidth: BOOK_COVER_SMALL_WIDTH, width: BOOK_COVER_SMALL_WIDTH }],
  medium: [baseCover, { minWidth: BOOK_COVER_MEDIUM_WIDTH, width: BOOK_COVER_MEDIUM_WIDTH }],
  large: [baseCover, { minWidth: BOOK_COVER_LARGE_WIDTH, width: BOOK_COVER_LARGE_WIDTH }],
  xlarge: [baseCover, { minWidth: BOOK_COVER_XLARGE_WIDTH, width: BOOK_COVER_XLARGE_WIDTH }],
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

const baseTitle = style([typography.title, { maxHeight: '70%', overflow: 'clip' }]);

export const title = styleVariants({
  small: [baseTitle, { fontSize: '9px' }],
  medium: [baseTitle, { fontSize: '11px' }],
  large: [baseTitle, {}],
  xlarge: [baseTitle, {}],
});

const baseAuthor = style([typography.body]);

export const author = styleVariants({
  small: [baseAuthor, { fontSize: '9px' }],
  medium: [baseAuthor, { fontSize: '11px' }],
  large: [baseAuthor, {}],
  xlarge: [baseAuthor, {}],
});
