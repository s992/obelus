import { createThemeContract } from '@vanilla-extract/css';

export const vars = createThemeContract({
  /* ─────────── Color ─────────── */
  color: {
    // Surfaces
    bg: null, // page background
    surface: null, // raised surface (cards, fields, field bg)
    tint: null, // subtle hover/selection wash (semi-transparent)

    // Ink (text)
    ink: null, // primary — book titles, headings, body emphasis
    ink2: null, // secondary — author lines, body copy, dates
    ink3: null, // tertiary — labels, meta, translator, italic notes

    // Lines + form chrome
    rule: null, // hairline dividers between rows
    fieldRule: null, // input borders (slightly stronger than rule)

    // Accent — single color for active links / selected state
    accent: null,

    // Judgment hues
    good: null, // accepted
    warn: null, // mixed
    bad: null, // rejected
  },

  /* ─────────── Typography ─────────── */

  // Three roles. Display is reserved for headings, book titles, and the
  // italic placeholder text on cover stand-ins. Body covers everything
  // running text. Mono is for labels, dates, counts, table headers.
  font: {
    body: null,
    display: null,
    mono: null,
  },

  // Every distinct size used in Obelus.html. Names follow role, not scale —
  // `bookTitle` always means "the size used for a book title in a list row".
  // If you find yourself reaching for an in-between value, fix the layout.
  fontSize: {
    label: null,
    body: null,
    title: null,
    h2: null,
    h1: null,
    display: null,
  },

  lineHeight: {
    tight: null,
    normal: null,
  },

  fontWeight: {
    regular: null,
    display: null,
  },

  letterSpacing: {
    display: null,
    label: null,
  },

  /* ─────────── Spacing ─────────── */
  // One scale, seven steps.
  space: {
    s1: null,
    s2: null,
    s3: null,
    s4: null,
    s5: null,
    s6: null,
    s7: null,
  },

  /* ─────────── Radii + line ─────────── */
  radius: {
    sm: null, // cards, buttons, fields
    pill: null, // chips, status pills (999)
    cover: null, // book cover placeholder corner (2px — kept tiny)
  },
  borderWidth: {
    hairline: null, // 1px — every line in this design
  },

  /* ─────────── Density ─────────── */
  // Pulled out of the space scale because it's the only thing that
  // meaningfully changes across screens / density presets.
  rowPaddingY: null,
});

export const sectionDivider = `${vars.borderWidth.hairline} solid ${vars.color.rule}`;
