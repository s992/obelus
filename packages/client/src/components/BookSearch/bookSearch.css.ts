import { style } from '@vanilla-extract/css';

import { BOOK_COVER_DEFAULT_WIDTH, typography, vars } from '../../style';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s5,
});

export const tableContainer = style({ overflowY: 'auto', maxHeight: '655px' });

export const tableHeader = style({ position: 'sticky', top: 0, background: vars.color.bg });

export const tableRow = style({
  cursor: 'pointer',
  ':hover': {
    background: vars.color.tint,
  },
});

export const coverCell = style({
  width: BOOK_COVER_DEFAULT_WIDTH,
});

export const cover = style({
  aspectRatio: '2 / 3',
  maxWidth: '100%',
});

export const bookTitle = style([typography.bookTitle]);

export const bookAuthor = style([typography.author]);

export const spinnerContainer = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});
