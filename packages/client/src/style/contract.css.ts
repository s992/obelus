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
    coverLabel: null, // 7.5  — uppercase author on cover placeholder
    coverTitle: null, // 9    — italic title on cover placeholder
    label: null, // 10.5 — caps mono labels (.lbl, col headers)
    labelLg: null, // 11   — caps labels at slightly more presence
    //        (top meta, section number, swatch var,
    //         scale-row keys, card meta)
    metaMono: null, // 12   — mono meta line ("started … last touched …")
    chip: null, // 12   — judgment chip text
    translator: null, // 12.5 — italic translator under publish year
    cardAuthor: null, // 13   — author line in card variant
    button: null, // 13.5 — button label
    metaItalic: null, // 13.5 — italic meta, book-row author/date
    body: null, // 14   — base body copy, nav, judg word, notes,
    //        field placeholders, sec-sub
    bodyLg: null, // 15   — preferred reading size (specimen body,
    //        published year)
    cardTitle: null, // 16   — card-variant book title
    bookTitle: null, // 18   — book-row title (list)
    h2: null, // 22   — H2, brand wordmark
    sectionH: null, // 28   — section header
    display: null, // 40   — type specimen display
  },

  lineHeight: {
    coverTitle: null, // 1.1   — italic placeholder cover
    bookTitle: null, // 1.15  — list-row title
    h2: null, // 1.2   — H2 + button line-height
    chip: null, // 1.4   — chip wraps tightly
    body: null, // 1.5   — base body / nav
    long: null, // 1.55  — long-form body, notes
    display: null, // 1.05  — display
  },

  fontWeight: {
    regular: null, // 400
    display: null, // 500 (editorial uses 500; modern flips to 600 if added)
    medium: null, // 500 — swatch name, body emphasis
  },

  letterSpacing: {
    display: null, // -0.005em — display, all serif headings/titles
    body: null, // 0
    metaMono: null, // 0.01em — slightly opened mono meta
    label: null, // 0.06em — caps mono labels
    coverCap: null, // 0.08em — extra-tight caps on cover author
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
