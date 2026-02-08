import { vars } from "@/styles/theme.ve.css";
import { keyframes, style } from "@vanilla-extract/css";

const obelusPulse = keyframes({
  "0%": {
    opacity: 0.35,
    transform: "scale(0.94)",
  },
  "50%": {
    opacity: 1,
    transform: "scale(1)",
  },
  "100%": {
    opacity: 0.35,
    transform: "scale(0.94)",
  },
});

export const loadingState = style({
  display: "grid",
  justifyItems: "center",
  gap: "0.5rem",
  padding: "1.5rem 1rem",
  border: `1px solid ${vars.color.borderPrimary}`,
  borderRadius: "10px",
  backgroundColor: vars.color.bgPrimary,
});

export const loadingStateCompact = style([
  loadingState,
  {
    justifyItems: "start",
    padding: "0.75rem 0",
    border: "none",
    borderRadius: 0,
  },
]);

export const loadingObelus = style({
  margin: 0,
  color: vars.color.textSecondary,
  fontSize: "1.375rem",
  lineHeight: 1,
  animation: `${obelusPulse} 1.2s ease-in-out infinite`,
});

export const loadingText = style({
  margin: 0,
  fontSize: "0.8125rem",
  color: vars.color.textSecondary,
  letterSpacing: "0.02em",
});
