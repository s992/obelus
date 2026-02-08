import { createGlobalTheme, globalStyle } from "@vanilla-extract/css";

export const vars = createGlobalTheme(":root", {
  color: {
    bgPrimary: "#FFFFFF",
    bgSecondary: "#F9FAFB",
    bgTertiary: "#FCFCFD",
    textPrimary: "#101828",
    textSecondary: "#475467",
    textTertiary: "#667085",
    borderPrimary: "#EAECF0",
    borderSecondary: "#F2F4F7",
    borderTertiary: "#D0D5DD",
    success: "#027A48",
    successBg: "#ECFDF3",
    error: "#B42318",
    errorBg: "#FEF3F2",
    gray700: "#344054",
  },
  font: {
    interface: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    content: '"Crimson Pro", Georgia, serif',
  },
  shadow: {
    card: "0px 1px 2px rgba(16, 24, 40, 0.06)",
  },
});

globalStyle("*", { boxSizing: "border-box" });

globalStyle("body", {
  margin: 0,
  backgroundColor: vars.color.bgPrimary,
  color: vars.color.textPrimary,
  fontFamily: vars.font.interface,
  fontWeight: 400,
  lineHeight: 1.5,
});

globalStyle("button, input, textarea, select", {
  fontFamily: vars.font.interface,
});

globalStyle("h1, h2, h3, h4, h5, h6, p", {
  margin: 0,
});
