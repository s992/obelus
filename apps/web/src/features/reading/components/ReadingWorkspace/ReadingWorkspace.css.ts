import { vars } from "@/styles/theme.ve.css";
import { style } from "@vanilla-extract/css";

export const readingWorkspace = style({
  display: "grid",
  gridTemplateColumns: "minmax(320px, 0.95fr) minmax(0, 1.25fr)",
  gap: "2rem",
  alignItems: "start",
  "@media": {
    "(max-width: 1120px)": {
      gridTemplateColumns: "1fr",
    },
  },
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

export const listCard = style([
  card,
  {
    minHeight: "620px",
    maxHeight: "min(72vh, 980px)",
    display: "flex",
    flexDirection: "column",
  },
]);

export const detailCard = style([
  card,
  {
    alignContent: "start",
    minHeight: "620px",
  },
]);

export const headerActionRow = style({
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  flexWrap: "wrap",
});

export const searchInputWrap = style({
  width: "100%",
  position: "relative",
});

export const searchIcon = style({
  position: "absolute",
  top: "50%",
  left: "14px",
  transform: "translateY(-50%)",
  color: vars.color.textSecondary,
  pointerEvents: "none",
  zIndex: 1,
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

export const searchInputWrapper = style([
  inputWrapper,
  {
    width: "100%",
  },
]);

export const searchInputField = style([
  inputField,
  {
    padding: "12px 40px 12px 44px !important",
  },
]);

export const searchClearButton = style({
  position: "absolute",
  top: "50%",
  right: "10px",
  transform: "translateY(-50%)",
  width: "24px",
  height: "24px",
  border: "none",
  borderRadius: "999px",
  backgroundColor: "transparent",
  color: vars.color.textSecondary,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  selectors: {
    "&:hover": {
      backgroundColor: vars.color.bgSecondary,
      color: vars.color.textPrimary,
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: `0 0 0 2px ${vars.color.textPrimary}`,
    },
  },
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

export const tabRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
});

const tabButtonBase = style([
  buttonBase,
  {
    border: `1px solid ${vars.color.borderPrimary}`,
    backgroundColor: vars.color.bgPrimary,
    color: vars.color.textSecondary,
  },
]);

export const tabButton = tabButtonBase;

export const tabButtonActive = style([
  tabButtonBase,
  {
    color: vars.color.textPrimary,
    borderColor: vars.color.textPrimary,
    backgroundColor: vars.color.bgTertiary,
  },
]);

export const listContainer = style({
  display: "grid",
  flex: 1,
  minHeight: 0,
});

export const virtualListViewport = style({
  height: "100%",
  overflowY: "auto",
  overflowX: "hidden",
});

export const bookListRow = style({
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
  cursor: "pointer",
  selectors: {
    "&:hover": {
      backgroundColor: vars.color.bgSecondary,
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: `inset 0 0 0 2px ${vars.color.textPrimary}`,
      borderRadius: "8px",
    },
  },
  "@media": {
    "(max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
});

export const virtualizedBookListRow = style([
  bookListRow,
  {
    margin: 0,
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

export const toast = style({
  position: "fixed",
  right: "20px",
  bottom: "20px",
  border: `1px solid ${vars.color.borderPrimary}`,
  backgroundColor: vars.color.bgPrimary,
  color: vars.color.textSecondary,
  fontSize: "0.75rem",
  padding: "0.5rem 0.75rem",
  borderRadius: "8px",
  boxShadow: vars.shadow.card,
  zIndex: 40,
});

export const bookHeader = style({
  display: "grid",
  gap: "0.25rem",
});

export const bookHeaderTop = style({
  display: "grid",
  gridTemplateColumns: "112px 1fr",
  gap: "1rem",
  alignItems: "start",
  "@media": {
    "(max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
});

export const bookHeaderContent = style({
  display: "grid",
  gap: "0.25rem",
});

export const bookTitle = style({
  margin: 0,
  fontFamily: vars.font.content,
  fontSize: "1.875rem",
  fontWeight: 600,
  lineHeight: 1.3,
  color: vars.color.textPrimary,
});

export const bookAuthor = style({
  margin: 0,
  fontFamily: vars.font.content,
  fontStyle: "italic",
  fontSize: "0.875rem",
  color: vars.color.textSecondary,
});

export const metadataInline = style({
  display: "grid",
  gap: "0.625rem",
  paddingTop: "0.375rem",
});

export const metadataTitle = style({
  margin: 0,
  fontSize: "0.75rem",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: vars.color.textTertiary,
});

export const metadataList = style({
  display: "grid",
  gap: "0.25rem",
});

export const metadataLine = style({
  margin: 0,
  fontSize: "0.8125rem",
  lineHeight: 1.6,
  color: vars.color.textSecondary,
});

export const metadataLabel = style({
  color: vars.color.textSecondary,
  fontWeight: 400,
});

export const metadataValue = style({
  color: vars.color.textSecondary,
  fontWeight: 400,
});

export const metadataDescriptionGroup = style({
  display: "grid",
  gap: "0.375rem",
});

export const metadataDescriptionTitle = style({
  margin: 0,
  fontSize: "0.75rem",
  color: vars.color.textTertiary,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
});

export const sectionBlock = style({
  display: "grid",
  gap: "0.75rem",
  paddingTop: "1.5rem",
  borderTop: `1px solid ${vars.color.borderSecondary}`,
});

export const emptyDetailState = style({
  display: "grid",
  gap: "0.75rem",
  alignContent: "start",
});

export const fieldLabel = style({
  margin: 0,
  fontSize: "0.75rem",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: vars.color.textTertiary,
});

export const actionRow = style({
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap",
});

export const actionToggle = style([
  buttonBase,
  {
    border: `1px solid ${vars.color.borderPrimary}`,
    backgroundColor: vars.color.bgPrimary,
    color: vars.color.textSecondary,
  },
]);

export const actionToggleActive = style([
  buttonBase,
  {
    border: `1px solid ${vars.color.textPrimary}`,
    backgroundColor: vars.color.bgTertiary,
    color: vars.color.textPrimary,
  },
]);

export const errorText = style({
  margin: 0,
  color: vars.color.error,
  fontSize: "0.75rem",
});

export const deleteConfirmBox = style({
  display: "grid",
  gap: "0.75rem",
  padding: "0.875rem",
  border: `1px solid ${vars.color.borderTertiary}`,
  borderRadius: "8px",
  backgroundColor: vars.color.bgSecondary,
});

export const deleteConfirmBody = style({
  margin: 0,
  color: vars.color.textSecondary,
  fontSize: "0.8125rem",
  lineHeight: 1.6,
});

export const deleteConfirmActions = style({
  display: "flex",
  gap: "0.625rem",
  flexWrap: "wrap",
});

export const queueSection = style({
  display: "grid",
  gap: "1rem",
  paddingTop: "1.5rem",
  borderTop: `1px solid ${vars.color.borderSecondary}`,
});

export const sectionTitle = style({
  margin: 0,
  fontSize: "1.25rem",
  lineHeight: 1.3,
  fontWeight: 600,
  fontFamily: vars.font.content,
});

export const fieldStack = style({
  display: "grid",
  gap: "0.5rem",
});

export const formStack = style({
  display: "grid",
  gap: "0.75rem",
});

export const judgmentRow = style({
  display: "flex",
  gap: "0.75rem",
});

const judgmentBase = style([
  buttonBase,
  {
    flex: 1,
    borderWidth: "2px",
    borderStyle: "solid",
    backgroundColor: vars.color.bgPrimary,
  },
]);

export const judgmentAccepted = style([
  judgmentBase,
  {
    borderColor: vars.color.borderPrimary,
    color: vars.color.textPrimary,
  },
]);

export const judgmentAcceptedActive = style([
  judgmentBase,
  {
    borderColor: vars.color.success,
    backgroundColor: vars.color.successBg,
    color: vars.color.success,
  },
]);

export const judgmentRejected = style([
  judgmentBase,
  {
    borderColor: vars.color.borderPrimary,
    color: vars.color.textPrimary,
  },
]);

export const judgmentRejectedActive = style([
  judgmentBase,
  {
    borderColor: vars.color.error,
    backgroundColor: vars.color.errorBg,
    color: vars.color.error,
  },
]);

export const judgmentUnjudged = style([
  judgmentBase,
  {
    borderColor: vars.color.borderPrimary,
    color: vars.color.textPrimary,
  },
]);

export const judgmentUnjudgedActive = style([
  judgmentBase,
  {
    borderColor: vars.color.textPrimary,
    backgroundColor: vars.color.bgTertiary,
    color: vars.color.textPrimary,
  },
]);

export const sectionGridTwo = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "1rem",
  "@media": {
    "(max-width: 980px)": {
      gridTemplateColumns: "1fr",
    },
  },
});

export const notesArea = style({
  width: "100%",
  padding: "12px 14px",
  border: `1px solid ${vars.color.borderTertiary}`,
  borderRadius: "8px",
  backgroundColor: vars.color.bgPrimary,
  color: vars.color.textPrimary,
  minHeight: "230px",
  resize: "vertical",
  fontFamily: vars.font.content,
  fontSize: "1rem",
  lineHeight: 1.65,
  selectors: {
    "&::placeholder": {
      color: vars.color.textSecondary,
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: `0 0 0 2px ${vars.color.textPrimary}`,
      borderColor: "transparent",
    },
  },
});

export const primaryButton = style([
  buttonBase,
  {
    border: `1px solid ${vars.color.textPrimary}`,
    backgroundColor: vars.color.textPrimary,
    color: vars.color.bgPrimary,
  },
]);

export const ghostButton = style([
  buttonBase,
  {
    border: `1px solid ${vars.color.borderTertiary}`,
    backgroundColor: vars.color.bgPrimary,
    color: vars.color.textPrimary,
  },
]);

export const compactTextArea = style({
  width: "100%",
  padding: "10px 14px",
  border: `1px solid ${vars.color.borderTertiary}`,
  borderRadius: "8px",
  backgroundColor: vars.color.bgPrimary,
  color: vars.color.textPrimary,
  fontFamily: vars.font.interface,
  fontSize: "0.875rem",
  lineHeight: 1.45,
  resize: "vertical",
  selectors: {
    "&::placeholder": {
      color: vars.color.textSecondary,
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: `0 0 0 2px ${vars.color.textPrimary}`,
      borderColor: "transparent",
    },
  },
});

export const progressSlider = style({
  width: "100%",
  accentColor: vars.color.textPrimary,
});

export const priorityGroup = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
});

export const priorityFieldset = style({
  border: 0,
  margin: 0,
  padding: 0,
  minInlineSize: 0,
});

export const priorityInput = style({
  position: "absolute",
  opacity: 0,
  pointerEvents: "none",
});

const priorityPillBase = style({
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: `1px solid ${vars.color.borderTertiary}`,
  borderRadius: "999px",
  minWidth: "44px",
  padding: "0.25rem 0.75rem",
  cursor: "pointer",
  fontSize: "0.75rem",
  color: vars.color.textTertiary,
  backgroundColor: vars.color.bgSecondary,
  selectors: {
    "&:focus-within": {
      boxShadow: `0 0 0 2px ${vars.color.textPrimary}`,
    },
  },
});

export const priorityPill = priorityPillBase;

export const priorityPillActive = style([
  priorityPillBase,
  {
    borderColor: vars.color.borderPrimary,
    backgroundColor: vars.color.bgTertiary,
    color: vars.color.textPrimary,
  },
]);

export const dangerButton = style([
  buttonBase,
  {
    border: `1px solid ${vars.color.error}`,
    backgroundColor: vars.color.errorBg,
    color: vars.color.error,
  },
]);
