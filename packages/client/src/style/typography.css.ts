import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from './contract.css';

/* ─────────── Display + headings ─────────── */

// Type-specimen / hero display. Used sparingly — once per page at most.
const display = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.display,
  lineHeight: vars.lineHeight.display,
  fontWeight: vars.fontWeight.display,
  letterSpacing: vars.letterSpacing.display,
  color: vars.color.ink,
  margin: 0,
});

// Section header — "Typography", "Color", "Components".
const sectionH = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.sectionH,
  lineHeight: vars.lineHeight.h2,
  fontWeight: vars.fontWeight.display,
  letterSpacing: vars.letterSpacing.display,
  color: vars.color.ink,
  margin: 0,
});

// H2 — note headers, brand wordmark, sub-section titles.
const h2 = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.h2,
  lineHeight: vars.lineHeight.h2,
  fontWeight: vars.fontWeight.display,
  letterSpacing: vars.letterSpacing.display,
  color: vars.color.ink,
  margin: 0,
});

// Brand wordmark — same metrics as h2 but tightly coupled to the obelus mark.
const brand = h2;

/* ─────────── Book titles ─────────── */

// List-row book title — primary handle in the editorial table.
const bookTitle = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.bookTitle,
  lineHeight: vars.lineHeight.bookTitle,
  fontWeight: vars.fontWeight.display,
  letterSpacing: vars.letterSpacing.display,
  color: vars.color.ink,
});

// Card-variant book title (smaller, tighter container).
const cardTitle = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.cardTitle,
  lineHeight: vars.lineHeight.bookTitle,
  fontWeight: vars.fontWeight.display,
  letterSpacing: vars.letterSpacing.display,
  color: vars.color.ink,
});

/* ─────────── Body copy ─────────── */

// Base body — running text, nav, judgment word, search placeholder.
const body = style({
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.body,
  lineHeight: vars.lineHeight.body,
  fontWeight: vars.fontWeight.regular,
  letterSpacing: vars.letterSpacing.body,
  color: vars.color.ink,
});

// Larger body — type-specimen body, preferred long-form reading size.
const bodyLg = style({
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.bodyLg,
  lineHeight: vars.lineHeight.long,
  fontWeight: vars.fontWeight.regular,
  letterSpacing: vars.letterSpacing.body,
  color: vars.color.ink2,
});

// Long-form note text — italic, ink-2, 1.55 line-height.
const note = style({
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.body,
  lineHeight: vars.lineHeight.long,
  fontWeight: vars.fontWeight.regular,
  letterSpacing: vars.letterSpacing.body,
  fontStyle: 'italic',
  color: vars.color.ink2,
});

/* ─────────── Author + meta ─────────── */

// Book-row author line.
const author = style({
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.metaItalic,
  lineHeight: vars.lineHeight.body,
  fontWeight: vars.fontWeight.regular,
  letterSpacing: vars.letterSpacing.body,
  color: vars.color.ink2,
});

// Card-variant author (italic, slightly smaller).
const cardAuthor = style({
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.cardAuthor,
  lineHeight: vars.lineHeight.body,
  fontStyle: 'italic',
  color: vars.color.ink2,
});

// Italic meta — translator, "tr. Anthea Bell", revision marker.
const metaItalic = style({
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.translator,
  lineHeight: vars.lineHeight.body,
  fontStyle: 'italic',
  color: vars.color.ink3,
});

// Mono meta — "started 2026-04-12 · last touched 18 mar 2026".
const metaMono = style({
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.metaMono,
  lineHeight: vars.lineHeight.body,
  letterSpacing: vars.letterSpacing.metaMono,
  color: vars.color.ink2,
});

// Tabular date cell in the list (last touched, started).
const date = style({
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.metaItalic,
  lineHeight: vars.lineHeight.body,
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.ink2,
});

// Tabular numeric cell (notes count, etc).
const numeric = style({
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.body,
  lineHeight: vars.lineHeight.body,
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.ink2,
});

// Published year (display face, body size).
const published = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.bodyLg,
  lineHeight: vars.lineHeight.body,
  fontWeight: vars.fontWeight.regular,
  letterSpacing: vars.letterSpacing.display,
  color: vars.color.ink,
});

/* ─────────── Labels (caps mono) ─────────── */

// Default label — "WORKING NOTES", form labels.
const label = style({
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.label,
  lineHeight: vars.lineHeight.body,
  textTransform: 'uppercase',
  letterSpacing: vars.letterSpacing.label,
  color: vars.color.ink3,
});

// Slightly larger label — top-bar meta, section number, swatch var name.
const labelLg = style({
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.labelLg,
  lineHeight: vars.lineHeight.body,
  textTransform: 'uppercase',
  letterSpacing: vars.letterSpacing.label,
  color: vars.color.ink3,
});

// Column header in the editorial list (caps mono, ink-3).
const colHeader = label;

/* ─────────── Components ─────────── */

// Button label.
const button = style({
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.button,
  lineHeight: vars.lineHeight.h2,
  fontWeight: vars.fontWeight.regular,
  letterSpacing: vars.letterSpacing.body,
  color: vars.color.ink,
});

// Judgment chip text.
const chip = style({
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.chip,
  lineHeight: vars.lineHeight.chip,
  fontWeight: vars.fontWeight.regular,
  letterSpacing: vars.letterSpacing.body,
});

// Inline judgment word ("accepted", "mixed", "rejected") — color applied
// at the use site via judgmentColor variants below.
const judgment = style({
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.body,
  lineHeight: vars.lineHeight.body,
});

// "· revised 1" trailing italic gray after a judgment.
const judgmentRev = style({
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.body,
  fontStyle: 'italic',
  color: vars.color.ink3,
});

/* ─────────── Cover placeholder ─────────── */

// Italic display title on the cover stand-in (9px).
const coverTitle = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.coverTitle,
  lineHeight: vars.lineHeight.coverTitle,
  fontWeight: vars.fontWeight.regular,
  letterSpacing: vars.letterSpacing.display,
  fontStyle: 'italic',
  color: vars.color.ink2,
});

// Caps mono author label on the cover stand-in (7.5px, 0.08em tracking).
const coverLabel = style({
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.coverLabel,
  lineHeight: vars.lineHeight.body,
  textTransform: 'uppercase',
  letterSpacing: vars.letterSpacing.coverCap,
  color: vars.color.ink3,
});

/* ─────────── Judgment color variants ─────────── */
//
// Compose with `judgment` for the inline word, or with `chip` for the pill.
// Usage:
//   <span className={`${typography.judgment} ${typography.judgmentColor.good}`}>
//     accepted
//   </span>

const judgmentColor = styleVariants({
  good: { color: vars.color.good },
  warn: { color: vars.color.warn },
  bad: { color: vars.color.bad },
  neutral: { color: vars.color.ink3, fontStyle: 'italic' },
});

/* ─────────── Bundle ─────────── */
//
// Export as a single object for ergonomic imports.

export const typography = {
  // headings
  display,
  sectionH,
  h2,
  brand,

  // book titles
  bookTitle,
  cardTitle,

  // body
  body,
  bodyLg,
  note,

  // author + meta
  author,
  cardAuthor,
  metaItalic,
  metaMono,
  date,
  numeric,
  published,

  // labels
  label,
  labelLg,
  colHeader,

  // components
  button,
  chip,
  judgment,
  judgmentRev,
  judgmentColor,

  // cover
  coverTitle,
  coverLabel,
} as const;
