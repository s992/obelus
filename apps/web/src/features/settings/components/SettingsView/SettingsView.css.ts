import { vars } from "@/styles/theme.ve.css";
import { style } from "@vanilla-extract/css";

export const analyticsView = style({
  display: "grid",
  gap: "2rem",
});

export const card = style({
  border: `1px solid ${vars.color.borderPrimary}`,
  borderRadius: "12px",
  backgroundColor: vars.color.bgPrimary,
  boxShadow: vars.shadow.card,
  padding: "2rem",
  display: "grid",
  gap: "1.5rem",
});

export const sectionTitle = style({
  margin: 0,
  fontSize: "1.25rem",
  lineHeight: 1.3,
  fontWeight: 600,
  fontFamily: vars.font.content,
});

export const formStack = style({
  display: "grid",
  gap: "0.75rem",
});

export const fieldStack = style({
  display: "grid",
  gap: "0.5rem",
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
  selectors: {
    "&::placeholder": {
      color: `${vars.color.textSecondary} !important`,
    },
  },
});

export const nativeSelect = style({
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: `1px solid ${vars.color.borderTertiary}`,
  backgroundColor: vars.color.bgPrimary,
  color: vars.color.textPrimary,
  fontFamily: vars.font.interface,
  fontSize: "0.875rem",
  selectors: {
    "&:focus-visible": {
      outline: "none",
      boxShadow: `0 0 0 2px ${vars.color.textPrimary}`,
      borderColor: "transparent",
    },
  },
});

export const headerActionRow = style({
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  flexWrap: "wrap",
});

export const linkButton = style({
  border: "none",
  background: "transparent",
  color: vars.color.textPrimary,
  textDecoration: "underline",
  cursor: "pointer",
  padding: 0,
  fontSize: "0.875rem",
});

const buttonBase = style({
  borderRadius: "8px",
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

export const ghostButton = style([
  buttonBase,
  {
    border: `1px solid ${vars.color.borderTertiary}`,
    backgroundColor: vars.color.bgPrimary,
    color: vars.color.textPrimary,
  },
]);

export const primaryButton = style([
  buttonBase,
  {
    border: `1px solid ${vars.color.textPrimary}`,
    backgroundColor: vars.color.textPrimary,
    color: vars.color.bgPrimary,
  },
]);

export const errorText = style({
  margin: 0,
  color: vars.color.error,
  fontSize: "0.75rem",
});

export const successText = style({
  margin: 0,
  color: vars.color.success,
  fontSize: "0.75rem",
});

export const actionRow = style({
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap",
});

export const toast = style({
  position: "fixed",
  right: "20px",
  bottom: "20px",
  border: `1px solid ${vars.color.borderPrimary}`,
  backgroundColor: vars.color.bgPrimary,
  color: vars.color.textPrimary,
  fontSize: "0.8125rem",
  padding: "0.5rem 0.75rem",
  borderRadius: "8px",
  boxShadow: vars.shadow.card,
  zIndex: 40,
});
