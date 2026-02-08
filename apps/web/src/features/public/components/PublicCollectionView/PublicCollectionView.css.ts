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

export const card = style({
  border: `1px solid ${vars.color.borderPrimary}`,
  borderRadius: "12px",
  backgroundColor: vars.color.bgPrimary,
  boxShadow: vars.shadow.card,
  padding: "2rem",
  display: "grid",
  gap: "1.5rem",
});

export const pageTitle = style({
  margin: 0,
  fontSize: "2.25rem",
  lineHeight: 1.2,
  fontWeight: 600,
});

export const sectionTitle = style({
  margin: 0,
  fontSize: "1.25rem",
  lineHeight: 1.3,
  fontWeight: 600,
  fontFamily: vars.font.content,
});

export const sectionBlock = style({
  display: "grid",
  gap: "0.75rem",
  paddingTop: "1.5rem",
  borderTop: `1px solid ${vars.color.borderSecondary}`,
});

export const listContainer = style({
  display: "grid",
});

const bookListRow = style({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "0.75rem",
  alignItems: "center",
  width: "100%",
  border: "none",
  borderBottom: `1px solid ${vars.color.borderPrimary}`,
  backgroundColor: vars.color.bgPrimary,
  textAlign: "left",
  padding: "20px 12px",
  margin: "0 -12px",
  borderRadius: "8px",
});

export const bookListRowReadOnly = style([
  bookListRow,
  {
    cursor: "default",
  },
]);

export const bookRowContent = style({
  display: "grid",
  gridTemplateColumns: "48px 1fr",
  alignItems: "start",
  gap: "0.875rem",
});

export const bookRowMain = style({
  minWidth: 0,
});

export const bookListTitle = style({
  margin: 0,
  fontFamily: vars.font.content,
  fontSize: "1.25rem",
  fontWeight: 600,
  lineHeight: 1.35,
  color: vars.color.textPrimary,
});

export const bookListAuthor = style({
  margin: 0,
  fontFamily: vars.font.content,
  fontStyle: "italic",
  fontSize: "0.875rem",
  color: vars.color.textSecondary,
});

export const bookMetaRow = style({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "0.75rem",
  fontSize: "0.75rem",
  color: vars.color.textSecondary,
});

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

export const readingBadge = style([
  badgeBase,
  {
    backgroundColor: vars.color.borderSecondary,
    color: vars.color.gray700,
    borderColor: vars.color.gray700,
  },
]);

export const mutedBody = style({
  margin: 0,
  color: vars.color.textSecondary,
  fontSize: "0.875rem",
  lineHeight: 1.6,
});

export const actionRow = style({
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap",
});

const buttonBase = style({
  borderRadius: "8px",
  padding: "10px 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
  cursor: "pointer",
  transition: "border-color 160ms ease, background-color 160ms ease, color 160ms ease",
  fontFamily: vars.font.interface,
});

export const ghostButton = style([
  buttonBase,
  {
    border: `1px solid ${vars.color.borderTertiary}`,
    backgroundColor: vars.color.bgPrimary,
    color: vars.color.textPrimary,
  },
]);
