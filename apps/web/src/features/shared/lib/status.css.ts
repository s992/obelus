import { vars } from "@/styles/theme.ve.css";
import { style } from "@vanilla-extract/css";

const badgeBase = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "6px",
  padding: "2px 10px",
  fontSize: "0.75rem",
  fontWeight: 500,
  border: "1px solid",
});

export const acceptedBadge = style([
  badgeBase,
  {
    backgroundColor: vars.color.successBg,
    color: vars.color.success,
    borderColor: vars.color.success,
  },
]);

export const rejectedBadge = style([
  badgeBase,
  {
    backgroundColor: vars.color.errorBg,
    color: vars.color.error,
    borderColor: vars.color.error,
  },
]);

export const readingBadge = style([
  badgeBase,
  {
    backgroundColor: vars.color.borderSecondary,
    color: vars.color.gray700,
    borderColor: vars.color.gray700,
  },
]);

export const unjudgedBadge = style([
  badgeBase,
  {
    backgroundColor: vars.color.bgSecondary,
    color: vars.color.textSecondary,
    borderColor: vars.color.borderTertiary,
  },
]);
