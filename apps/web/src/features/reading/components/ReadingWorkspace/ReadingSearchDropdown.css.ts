import { vars } from "@/styles/theme.ve.css";
import { style } from "@vanilla-extract/css";

export const dropdown = style({
  position: "absolute",
  top: "calc(100% + 8px)",
  left: 0,
  right: 0,
  maxHeight: "420px",
  overflowY: "auto",
  border: `1px solid ${vars.color.borderPrimary}`,
  borderRadius: "10px",
  backgroundColor: vars.color.bgPrimary,
  boxShadow: vars.shadow.card,
  zIndex: 30,
});

export const section = style({
  display: "grid",
});

export const sectionHeader = style({
  margin: 0,
  padding: "10px 12px",
  fontSize: "0.75rem",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: vars.color.textTertiary,
  borderTop: `1px solid ${vars.color.borderSecondary}`,
  selectors: {
    "&:first-child": {
      borderTop: "none",
    },
  },
});

export const statusRow = style({
  padding: "8px 12px 12px",
  margin: 0,
  fontSize: "0.875rem",
  color: vars.color.textSecondary,
});

export const collapsedRemoteRow = style({
  width: "100%",
  border: "none",
  backgroundColor: "transparent",
  textAlign: "left",
  padding: "8px 12px 12px",
  margin: 0,
  color: vars.color.textSecondary,
  fontSize: "0.875rem",
  lineHeight: 1.5,
  cursor: "default",
});

export const collapsedRemoteHint = style({
  display: "block",
  color: vars.color.textTertiary,
  fontSize: "0.75rem",
  marginTop: "2px",
});

export const optionRow = style({
  width: "100%",
  border: "none",
  backgroundColor: "transparent",
  padding: "10px 12px",
  display: "grid",
  gridTemplateColumns: "40px 1fr auto",
  gap: "10px",
  alignItems: "center",
  textAlign: "left",
  cursor: "pointer",
  selectors: {
    "&:hover": {
      backgroundColor: vars.color.bgSecondary,
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: `inset 0 0 0 2px ${vars.color.textPrimary}`,
    },
  },
});

export const optionRowActive = style({
  backgroundColor: vars.color.bgSecondary,
});

export const placeholderCover = style({
  width: "40px",
  height: "60px",
  borderRadius: "4px",
  border: `1px solid ${vars.color.borderSecondary}`,
  backgroundColor: vars.color.bgTertiary,
});

export const rowMain = style({
  minWidth: 0,
});

export const title = style({
  margin: 0,
  fontFamily: vars.font.content,
  fontSize: "0.95rem",
  lineHeight: 1.35,
  color: vars.color.textPrimary,
});

export const subtitle = style({
  margin: "2px 0 0",
  fontSize: "0.8125rem",
  color: vars.color.textSecondary,
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  overflow: "hidden",
});

export const meta = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "0.75rem",
  color: vars.color.textSecondary,
  whiteSpace: "nowrap",
});

export const statusPill = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  padding: "2px 8px",
  border: `1px solid ${vars.color.borderTertiary}`,
  backgroundColor: vars.color.bgTertiary,
  color: vars.color.textSecondary,
  fontSize: "0.6875rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
});
