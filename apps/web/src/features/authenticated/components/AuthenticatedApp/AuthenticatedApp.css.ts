import { vars } from "@/styles/theme.ve.css";
import { style } from "@vanilla-extract/css";

export const page = style({
  minHeight: "100vh",
  backgroundColor: vars.color.bgPrimary,
  color: vars.color.textPrimary,
});

export const container = style({
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "3rem 2rem",
  display: "grid",
  gap: "1.5rem",
});

export const navigation = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: `1px solid ${vars.color.borderPrimary}`,
  paddingBottom: "1rem",
  gap: "1rem",
  flexWrap: "wrap",
});

const logo = style({
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
});

export const logoButton = style([
  logo,
  {
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
  },
]);

export const logoSymbol = style({
  color: vars.color.textSecondary,
  fontSize: "1.25rem",
  lineHeight: 1,
});

export const logoText = style({
  color: vars.color.textPrimary,
  fontSize: "1.125rem",
  fontWeight: 600,
});

export const navLinks = style({
  display: "flex",
  alignItems: "center",
  gap: "1.5rem",
});

const navLinkBase = style({
  border: "none",
  borderBottom: "2px solid transparent",
  backgroundColor: "transparent",
  padding: "0.25rem 0",
  color: vars.color.textSecondary,
  fontSize: "0.875rem",
  fontWeight: 500,
  cursor: "pointer",
  transition: "color 160ms ease, border-color 160ms ease",
  selectors: {
    "&:hover": {
      color: vars.color.textPrimary,
    },
    "&:focus-visible": {
      outline: "none",
      borderBottomColor: vars.color.textPrimary,
      color: vars.color.textPrimary,
    },
  },
});

export const navLink = navLinkBase;

export const navLinkActive = style([
  navLinkBase,
  {
    color: vars.color.textPrimary,
    borderBottomColor: vars.color.textPrimary,
  },
]);

export const profileBar = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
});

export const metaText = style({
  margin: 0,
  color: vars.color.textSecondary,
  fontSize: "0.75rem",
  fontWeight: 500,
});

export const errorText = style({
  margin: 0,
  color: vars.color.error,
  fontSize: "0.75rem",
});
