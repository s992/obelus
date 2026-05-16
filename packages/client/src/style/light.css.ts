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
    label: '11px',
    body: '14px',
    title: '18px',
    h2: '22px',
    h1: '28px',
    display: '40px',
  },

  lineHeight: {
    tight: '1.15',
    normal: '1.5',
  },

  fontWeight: {
    regular: '400',
    display: '500',
  },

  letterSpacing: {
    display: '-0.005em',
    label: '0.06em',
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
