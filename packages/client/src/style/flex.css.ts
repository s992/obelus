import { style } from '@vanilla-extract/css';

const container = style({ display: 'flex' });
const column = style([container, { flexDirection: 'column' }]);
const horizontalCenter = style([container, { alignItems: 'center' }]);
const verticalCenter = style([column, { justifyContent: 'center' }]);
const center = style([verticalCenter, horizontalCenter]);

export const flex = {
  container,
  column,
  horizontalCenter,
  verticalCenter,
  center,
};
