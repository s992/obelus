import { vars } from "@/styles/theme.ve.css";
import { style } from "@vanilla-extract/css";

export const analyticsView = style({
  display: "grid",
  gap: "2rem",
});

export const fieldLabel = style({
  margin: 0,
  fontSize: "0.75rem",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: vars.color.textTertiary,
});

export const statGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "1.5rem",
  "@media": {
    "(max-width: 860px)": {
      gridTemplateColumns: "1fr",
    },
  },
});

export const statCard = style({
  border: `1px solid ${vars.color.borderPrimary}`,
  borderRadius: "12px",
  backgroundColor: vars.color.bgSecondary,
  padding: "2rem",
  display: "grid",
  gap: "0.5rem",
});

export const statValue = style({
  margin: 0,
  fontFamily: vars.font.content,
  fontSize: "2.25rem",
  fontWeight: 600,
  color: vars.color.textPrimary,
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

export const chartArea = style({
  display: "flex",
  alignItems: "flex-end",
  gap: "1rem",
  overflowX: "auto",
  overflowY: "visible",
  paddingBottom: "0.25rem",
});

export const chartColumn = style({
  display: "grid",
  justifyItems: "center",
  gap: "0.5rem",
  minWidth: "56px",
});

export const chartBars = style({
  minHeight: "130px",
  display: "flex",
  alignItems: "flex-end",
  gap: "0.25rem",
  overflow: "visible",
});

export const chartHoverTarget = style({
  display: "inline-flex",
  alignItems: "flex-end",
  cursor: "default",
});

export const chartTooltip = style({
  position: "fixed",
  pointerEvents: "none",
  zIndex: 100,
  whiteSpace: "nowrap",
  fontSize: "0.6875rem",
  lineHeight: 1.2,
  color: vars.color.bgPrimary,
  backgroundColor: vars.color.textPrimary,
  borderRadius: "6px",
  padding: "0.25rem 0.45rem",
  maxWidth: "220px",
  boxShadow: vars.shadow.card,
});

export const chartBarStarted = style({
  width: "14px",
  borderRadius: "4px",
  backgroundColor: vars.color.borderTertiary,
});

export const chartBarFinished = style({
  width: "14px",
  borderRadius: "4px",
  backgroundColor: vars.color.textPrimary,
});

export const chartZeroTick = style({
  width: "14px",
  height: "2px",
  borderRadius: "2px",
  backgroundColor: vars.color.borderPrimary,
});

export const chartLabel = style({
  fontSize: "0.75rem",
  color: vars.color.textSecondary,
});

export const authorList = style({
  display: "grid",
});

export const authorRow = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "0.75rem",
  padding: "0.875rem 0",
  borderBottom: `1px solid ${vars.color.borderPrimary}`,
});

export const bookListAuthor = style({
  margin: 0,
  fontFamily: vars.font.content,
  fontStyle: "italic",
  fontSize: "0.875rem",
  color: vars.color.textSecondary,
});

export const metaText = style({
  margin: 0,
  color: vars.color.textSecondary,
  fontSize: "0.75rem",
  fontWeight: 500,
});

export const mutedBody = style({
  margin: 0,
  color: vars.color.textSecondary,
  fontSize: "0.875rem",
  lineHeight: 1.6,
});
