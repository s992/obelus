import { vars } from "@/styles/theme.ve.css";
import { style } from "@vanilla-extract/css";

export const fieldStack = style({
  display: "grid",
  gap: "0.5rem",
});

export const labelRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
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

export const valueBadge = style({
  fontSize: "0.75rem",
  color: vars.color.textSecondary,
  backgroundColor: vars.color.bgSecondary,
  border: `1px solid ${vars.color.borderTertiary}`,
  borderRadius: "999px",
  padding: "0.125rem 0.5rem",
  minWidth: "42px",
  textAlign: "center",
});

export const slider = style({
  width: "100%",
  accentColor: vars.color.textPrimary,
});
