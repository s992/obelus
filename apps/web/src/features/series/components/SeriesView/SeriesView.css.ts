import { vars } from "@/styles/theme.ve.css";
import { globalStyle, style } from "@vanilla-extract/css";

export const card = style({
  display: "grid",
  gap: "1rem",
  padding: "1.25rem",
  border: `1px solid ${vars.color.borderPrimary}`,
  borderRadius: "12px",
  background: vars.color.bgPrimary,
});

export const header = style({
  display: "grid",
  gap: "0.375rem",
  borderBottom: `1px solid ${vars.color.borderSecondary}`,
  paddingBottom: "0.875rem",
});

export const title = style({
  margin: 0,
  fontFamily: vars.font.content,
  fontSize: "1.5rem",
  fontWeight: 600,
  color: vars.color.textPrimary,
});

export const metaText = style({
  margin: 0,
  fontSize: "0.8125rem",
  color: vars.color.textSecondary,
});

export const mutedBody = style({
  margin: 0,
  fontSize: "0.8125rem",
  color: vars.color.textSecondary,
  lineHeight: 1.6,
});

export const listWrap = style({
  display: "grid",
  gap: "0.75rem",
});

export const row = style({
  display: "grid",
  gap: "0.75rem",
  border: `1px solid ${vars.color.borderSecondary}`,
  borderRadius: "10px",
  padding: "0.75rem",
  backgroundColor: vars.color.bgSecondary,
  "@media": {
    "(min-width: 900px)": {
      gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr) 9.5rem",
      alignItems: "center",
    },
  },
});

export const rowMain = style({
  display: "grid",
  gridTemplateColumns: "2.5rem 48px minmax(0, 1fr)",
  gap: "0.625rem",
  alignItems: "start",
});

export const positionLabel = style({
  margin: 0,
  fontFamily: vars.font.interface,
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: vars.color.textTertiary,
});

export const titleBlock = style({
  display: "grid",
  gap: "0.25rem",
});

export const bookLink = style({
  color: vars.color.textPrimary,
  fontFamily: vars.font.content,
  fontSize: "1rem",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
});

export const authorText = style({
  margin: 0,
  color: vars.color.textSecondary,
  fontFamily: vars.font.content,
  fontStyle: "italic",
  fontSize: "0.8125rem",
});

export const descriptionBlock = style({
  display: "grid",
  gap: "0.125rem",
});

export const descriptionCollapsed = style({
  margin: 0,
  fontFamily: vars.font.interface,
  fontSize: "0.75rem",
  color: vars.color.textSecondary,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
});

globalStyle(`${descriptionCollapsed} *`, {
  display: "inline",
  margin: 0,
  padding: 0,
  whiteSpace: "inherit",
});

export const descriptionExpanded = style({
  margin: 0,
  fontFamily: vars.font.interface,
  fontSize: "0.75rem",
  color: vars.color.textSecondary,
  lineHeight: 1.45,
  maxWidth: "100%",
  overflowWrap: "anywhere",
});

globalStyle(`${descriptionExpanded} p`, {
  margin: 0,
});

globalStyle(`${descriptionExpanded} p + p`, {
  marginTop: "0.375rem",
});

globalStyle(`${descriptionExpanded} ul, ${descriptionExpanded} ol`, {
  margin: "0.25rem 0 0",
  paddingLeft: "1rem",
});

globalStyle(`${descriptionExpanded} li + li`, {
  marginTop: "0.125rem",
});

globalStyle(`${descriptionCollapsed} a, ${descriptionExpanded} a`, {
  color: vars.color.textSecondary,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
});

globalStyle(`${descriptionCollapsed} strong, ${descriptionExpanded} strong`, {
  color: vars.color.textSecondary,
  fontWeight: 600,
});

globalStyle(`${descriptionCollapsed} em, ${descriptionExpanded} em`, {
  fontStyle: "italic",
});

export const descriptionToggle = style({
  justifySelf: "start",
  border: "none",
  background: "transparent",
  color: vars.color.textSecondary,
  fontSize: "0.75rem",
  padding: 0,
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
  selectors: {
    "&:focus-visible": {
      outline: "none",
      boxShadow: `0 0 0 2px ${vars.color.textPrimary}`,
      borderRadius: "2px",
    },
  },
});

export const rowMeta = style({
  display: "flex",
  gap: "0.5rem",
  alignItems: "center",
  flexWrap: "wrap",
});

export const statusBadge = style({
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "6px",
  border: `1px solid ${vars.color.borderTertiary}`,
  padding: "2px 10px",
  fontSize: "0.75rem",
  color: vars.color.textSecondary,
  backgroundColor: vars.color.bgPrimary,
});

export const supportingText = style({
  fontSize: "0.75rem",
  color: vars.color.textSecondary,
});

export const rowAction = style({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  minWidth: "9.5rem",
});

export const queueActionButton = style({
  border: "none",
  background: "transparent",
  color: vars.color.textSecondary,
  fontSize: "0.8125rem",
  padding: 0,
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
  selectors: {
    "&:disabled": {
      cursor: "wait",
      color: vars.color.textTertiary,
      textDecoration: "none",
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: `0 0 0 2px ${vars.color.textPrimary}`,
      borderRadius: "2px",
    },
  },
});

export const queueActionText = style({
  margin: 0,
  fontSize: "0.8125rem",
  color: vars.color.textSecondary,
});

export const errorText = style({
  margin: 0,
  color: vars.color.error,
  fontSize: "0.8125rem",
});
