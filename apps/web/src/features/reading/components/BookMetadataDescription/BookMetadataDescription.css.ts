import { vars } from "@/styles/theme.ve.css";
import { globalStyle, style } from "@vanilla-extract/css";

export const markdownRoot = style({
  color: vars.color.textSecondary,
  fontSize: "0.8125rem",
  lineHeight: 1.65,
  fontFamily: vars.font.interface,
  maxWidth: "100%",
  overflowWrap: "anywhere",
});

globalStyle(`${markdownRoot} p`, {
  margin: 0,
});

globalStyle(`${markdownRoot} p + p`, {
  marginTop: "0.5rem",
});

globalStyle(`${markdownRoot} ul, ${markdownRoot} ol`, {
  margin: "0.25rem 0 0",
  paddingLeft: "1.125rem",
});

globalStyle(`${markdownRoot} li + li`, {
  marginTop: "0.125rem",
});

globalStyle(`${markdownRoot} a`, {
  color: vars.color.textSecondary,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
});

globalStyle(`${markdownRoot} strong`, {
  color: vars.color.textSecondary,
  fontWeight: 600,
});

globalStyle(`${markdownRoot} em`, {
  fontStyle: "italic",
});

globalStyle(`${markdownRoot} blockquote`, {
  margin: "0.25rem 0 0",
  paddingLeft: "0.625rem",
  borderLeft: `1px solid ${vars.color.borderPrimary}`,
  color: vars.color.textTertiary,
});

globalStyle(`${markdownRoot} code`, {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: "0.75rem",
});

globalStyle(`${markdownRoot} pre`, {
  margin: "0.5rem 0 0",
  padding: "0.5rem",
  overflowX: "auto",
  backgroundColor: vars.color.bgTertiary,
});

export const markdownRootCollapsed = style([
  markdownRoot,
  {
    maxHeight: "6.6em",
    overflow: "hidden",
  },
]);

export const expandButton = style({
  justifySelf: "start",
  border: "none",
  background: "transparent",
  color: vars.color.textSecondary,
  fontSize: "0.75rem",
  padding: 0,
  cursor: "pointer",
  textDecoration: "underline",
  selectors: {
    "&:focus-visible": {
      outline: "none",
      boxShadow: `0 0 0 2px ${vars.color.textPrimary}`,
      borderRadius: "2px",
    },
  },
});
