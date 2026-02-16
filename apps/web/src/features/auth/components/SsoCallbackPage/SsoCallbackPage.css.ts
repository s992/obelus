import { vars } from "@/styles/theme.ve.css";
import { style } from "@vanilla-extract/css";

export const page = style({
  minHeight: "100vh",
  backgroundColor: vars.color.bgPrimary,
  color: vars.color.textPrimary,
});

export const container = style({
  maxWidth: "640px",
  margin: "0 auto",
  padding: "4rem 1.5rem",
});

export const card = style({
  border: `1px solid ${vars.color.borderPrimary}`,
  borderRadius: "12px",
  backgroundColor: vars.color.bgPrimary,
  boxShadow: vars.shadow.card,
  padding: "2rem",
  display: "grid",
  gap: "1rem",
});

export const title = style({
  margin: 0,
  fontSize: "1.75rem",
  lineHeight: 1.25,
  fontWeight: 600,
});

export const bodyText = style({
  margin: 0,
  color: vars.color.textSecondary,
  fontSize: "0.875rem",
  lineHeight: 1.6,
});

export const formStack = style({
  display: "grid",
  gap: "0.75rem",
});

export const fieldLabel = style({
  margin: 0,
  fontSize: "0.75rem",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: vars.color.textTertiary,
});

export const inputWrapper = style({
  borderRadius: "8px !important",
  border: "0 !important",
  backgroundColor: `${vars.color.bgPrimary} !important`,
  boxShadow: `inset 0 0 0 1px ${vars.color.borderTertiary} !important`,
  selectors: {
    "&:focus-within": {
      boxShadow: `inset 0 0 0 2px ${vars.color.textPrimary} !important`,
    },
  },
});

export const inputField = style({
  width: "100%",
  padding: "10px 14px !important",
  borderRadius: "8px",
  border: "0 !important",
  boxShadow: "none !important",
  outline: "none !important",
  background: "transparent !important",
  color: `${vars.color.textPrimary} !important`,
  fontFamily: `${vars.font.interface} !important`,
  fontSize: "0.875rem !important",
  lineHeight: "1.45 !important",
});

export const errorText = style({
  margin: 0,
  color: vars.color.error,
  fontSize: "0.75rem",
});

export const primaryButton = style({
  borderRadius: "8px",
  border: `1px solid ${vars.color.textPrimary}`,
  backgroundColor: vars.color.textPrimary,
  color: vars.color.bgPrimary,
  padding: "10px 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
  cursor: "pointer",
  transition: "border-color 160ms ease, background-color 160ms ease, color 160ms ease",
  fontFamily: vars.font.interface,
  selectors: {
    "&:focus-visible": {
      outline: "none",
      boxShadow: `0 0 0 2px ${vars.color.textPrimary}`,
      borderColor: "transparent",
    },
  },
});

export const link = style({
  color: vars.color.textPrimary,
  fontSize: "0.875rem",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
});
