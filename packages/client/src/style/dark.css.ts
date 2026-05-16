import { createTheme } from '@vanilla-extract/css';

import { vars } from './contract.css';

export const darkTheme = createTheme(vars, {
  color: {
    // Ink palette
    bg: '#16161a',
    surface: '#1d1d22',
    tint: 'rgba(255, 253, 246, 0.04)',

    ink: '#e8e6df',
    ink2: '#a8a59c',
    ink3: '#6b6962',

    rule: '#2a2a31',
    fieldRule: '#34343d',

    // Desaturated brass — quiet highlight on dark
    accent: '#c9b07a',

    good: '#7ea877',
    warn: '#c9a86a',
    bad: '#cf8a82',
  },

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
