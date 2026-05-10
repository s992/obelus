import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '../../../style';

export const tableBody = style({
  selectors: {
    '&[data-empty=true]': {
      // typography.metaItalic
      fontFamily: vars.font.body,
      fontSize: vars.fontSize.translator,
      lineHeight: vars.lineHeight.body,
      fontStyle: 'italic',
      color: vars.color.ink3,
      textAlign: 'center',
    },
  },
});

globalStyle(`${tableBody}[data-empty=true] td`, {
  padding: vars.space.s7,
});
