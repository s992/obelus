import { style } from "@vanilla-extract/css";
import { vars } from "./theme.ve.css";

export const srOnly = style({
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
});

export const skipLink = style({
  position: "absolute",
  top: 0,
  left: 0,
  transform: "translateY(-120%)",
  zIndex: 1000,
  padding: "0.625rem 0.875rem",
  borderRadius: "0 0 8px 0",
  background: vars.color.textPrimary,
  color: vars.color.bgPrimary,
  fontSize: "0.875rem",
  textDecoration: "none",
  selectors: {
    "&:focus-visible": {
      transform: "translateY(0)",
      boxShadow: `0 0 0 2px ${vars.color.bgPrimary}, 0 0 0 4px ${vars.color.textPrimary}`,
      outline: "none",
    },
  },
});
