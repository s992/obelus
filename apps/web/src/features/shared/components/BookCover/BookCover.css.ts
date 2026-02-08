import { vars } from "@/styles/theme.ve.css";
import { style } from "@vanilla-extract/css";

export const coverThumb = style({
  width: "48px",
  height: "72px",
  borderRadius: "6px",
  objectFit: "cover",
  border: `1px solid ${vars.color.borderPrimary}`,
  backgroundColor: vars.color.bgSecondary,
});

export const coverLarge = style({
  width: "112px",
  height: "164px",
  borderRadius: "8px",
  objectFit: "cover",
  border: `1px solid ${vars.color.borderPrimary}`,
  backgroundColor: vars.color.bgSecondary,
});

export const coverFallback = style({
  width: "48px",
  height: "72px",
  borderRadius: "6px",
  border: `1px solid ${vars.color.borderPrimary}`,
  backgroundColor: vars.color.bgSecondary,
  color: vars.color.textSecondary,
  fontSize: "0.625rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0.25rem",
});
