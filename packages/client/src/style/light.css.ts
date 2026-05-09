import { createTheme } from '@vanilla-extract/css';

import { vars } from './contract.css';

export const lightTheme = createTheme(vars, {
  color: {
    // Bone palette
    bg: '#fafaf7',
    surface: '#ffffff',
    tint: 'rgba(0, 0, 0, 0.035)',

    ink: '#1a1a17',
    ink2: '#4a4a45',
    ink3: '#8a8a82',

    rule: '#e6e3dc',
    fieldRule: '#d8d4ca',

    accent: '#2f3a44',

    good: '#3e6b4a',
    warn: '#8a6a2e',
    bad: '#8a3e3a',
  },

  // Editorial pairing
  font: {
    body: `'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif`,
    display: `'Newsreader', Georgia, 'Times New Roman', serif`,
    mono: `'Sometype Mono', ui-monospace, 'IBM Plex Mono', monospace`,
  },

  fontSize: {
    coverLabel: '7.5px',
    coverTitle: '9px',
    label: '10.5px',
    labelLg: '11px',
    metaMono: '12px',
    chip: '12px',
    translator: '12.5px',
    cardAuthor: '13px',
    button: '13.5px',
    metaItalic: '13.5px',
    body: '14px',
    bodyLg: '15px',
    cardTitle: '16px',
    bookTitle: '18px',
    h2: '22px',
    sectionH: '28px',
    display: '40px',
  },

  lineHeight: {
    coverTitle: '1.1',
    bookTitle: '1.15',
    h2: '1.2',
    chip: '1.4',
    body: '1.5',
    long: '1.55',
    display: '1.05',
  },

  fontWeight: {
    regular: '400',
    display: '500', // editorial pairing uses 500 for serif display
    medium: '500',
  },

  letterSpacing: {
    display: '-0.005em',
    body: '0',
    metaMono: '0.01em',
    label: '0.06em',
    coverCap: '0.08em',
  },

  // Compact spacing
  space: {
    s1: '3px',
    s2: '6px',
    s3: '10px',
    s4: '14px',
    s5: '20px',
    s6: '32px',
    s7: '52px',
  },

  radius: {
    sm: '4px',
    pill: '999px',
    cover: '2px',
  },

  borderWidth: {
    hairline: '1px',
  },

  rowPaddingY: '12px',
});
