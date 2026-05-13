import { style, styleVariants } from '@vanilla-extract/css';

import { typography, vars } from '../../style';

const baseJudgment = style([typography.body]);

export const judgment = styleVariants({
  accepted: [baseJudgment, { color: vars.color.good }],
  rejected: [baseJudgment, { color: vars.color.bad }],
  mixed: [baseJudgment, { color: vars.color.warn }],
});
