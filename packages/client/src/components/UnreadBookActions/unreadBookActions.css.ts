import { style, styleVariants } from '@vanilla-extract/css';

import { flex, vars } from '../../style';

const baseContainer = style({ width: 'fit-content' });

export const container = styleVariants({
  horizontal: [flex.container, baseContainer, { gap: vars.space.s4 }],
  vertical: [flex.column, baseContainer, { flexDirection: 'column-reverse' }],
});

export const button = style({
  justifyContent: 'flex-start',
  width: 'fit-content',
});

export const responsive = style({
  '@media': {
    '(max-width: 640px)': {
      flexDirection: 'row',
      gap: vars.space.s3,
    },
  },
});
