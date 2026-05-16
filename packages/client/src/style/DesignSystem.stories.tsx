import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { vars } from './contract.css';
import { typography } from './typography.css';

const meta = {
  title: 'Design System',
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const DesignSystem: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: vars.space.s7 }}>
      <Section title="Typography">
        <div style={{ display: 'grid', gridTemplateColumns: '0.15fr 1fr', rowGap: 40, alignItems: 'center' }}>
          <span className={typography.label}>display</span>
          <h1 className={typography.display}>Obelus</h1>
          <span className={typography.label}>h1</span>
          <h1 className={typography.h1}>The Wandering Inn</h1>
          <span className={typography.label}>h2</span>
          <h2 className={typography.h2}>
            Notes for <em>Soulbound</em>, revised April 2026
          </h2>
          <span className={typography.label}>title</span>
          <h3 className={typography.title}>The Lies of Locke Lamora</h3>
          <span className={typography.label}>body</span>
          <p className={typography.body}>
            A man. His ex-girlfriend's cat. A sadistic game show unlike anything in the universe: a dungeon crawl where
            survival depends on killing your prey in the most entertaining way possible.
          </p>
          <span className={typography.label}>label</span>
          <span className={typography.label} style={{ textTransform: 'uppercase' }}>
            Title · Author · Published · Judgment · Notes
          </span>
        </div>
      </Section>
      <Section title="Color">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: vars.space.s4 }}>
          <Swatch colorToken={vars.color.bg} cssVar="--bg" name="Background" />
          <Swatch colorToken={vars.color.surface} cssVar="--surface" name="Surface" />
          <Swatch colorToken={vars.color.ink} cssVar="--ink" name="Ink" />
          <Swatch colorToken={vars.color.ink2} cssVar="--ink2" name="Ink 2" />
          <Swatch colorToken={vars.color.ink3} cssVar="--ink3" name="Ink 3" />
          <Swatch colorToken={vars.color.accent} cssVar="--accent" name="Accent" />
          <Swatch colorToken={vars.color.good} cssVar="--good" name="Good" />
          <Swatch colorToken={vars.color.warn} cssVar="--warn" name="Warn" />
          <Swatch colorToken={vars.color.bad} cssVar="--bad" name="Bad" />
          <Swatch colorToken={vars.color.rule} cssVar="--rule" name="Rule" />
          <Swatch colorToken={vars.color.fieldRule} cssVar="--fieldRule" name="Field Rule" />
          <Swatch colorToken={vars.color.tint} cssVar="--tint" name="Tint" />
        </div>
      </Section>
      <Section title="Spacing">
        <SpaceToken cssVar="--s-1" name="s1" token={vars.space.s1} value="03px" />
        <SpaceToken cssVar="--s-2" name="s2" token={vars.space.s2} value="06px" />
        <SpaceToken cssVar="--s-3" name="s3" token={vars.space.s3} value="10px" />
        <SpaceToken cssVar="--s-4" name="s4" token={vars.space.s4} value="14px" />
        <SpaceToken cssVar="--s-5" name="s5" token={vars.space.s5} value="20px" />
        <SpaceToken cssVar="--s-6" name="s6" token={vars.space.s6} value="32px" />
        <SpaceToken cssVar="--s-7" name="s7" token={vars.space.s7} value="52px" />
      </Section>
    </div>
  ),
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h1
        className={typography.h1}
        style={{
          borderBottom: `1px solid ${vars.color.rule}`,
          marginBottom: vars.space.s4,
          paddingBottom: vars.space.s4,
        }}
      >
        {title}
      </h1>
      {children}
    </div>
  );
}

function Swatch({ colorToken, name, cssVar }: { colorToken: string; name: string; cssVar: string }) {
  return (
    <div style={{ background: vars.color.surface, border: `1px solid ${vars.color.rule}` }}>
      <div style={{ padding: vars.space.s5 }}>
        <div
          style={{
            background: colorToken,
            width: '100%',
            borderRadius: '50%',
            aspectRatio: 1,
            border: `1px solid ${vars.color.rule}`,
          }}
        />
      </div>
      <div style={{ borderTop: `1px solid ${vars.color.rule}`, padding: vars.space.s4 }}>
        <p className={typography.body}>{name}</p>
        <span className={typography.label}>{cssVar}</span>
      </div>
    </div>
  );
}

function SpaceToken({ cssVar, name, value, token }: { cssVar: string; name: string; value: string; token: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr',
        alignItems: 'center',
        gap: vars.space.s4,
        justifyItems: 'start',
      }}
    >
      <span className={typography.label}>{cssVar}</span>
      <span className={typography.label}>
        {name} · {value}
      </span>
      <div
        style={{ backgroundColor: vars.color.ink, height: vars.space.s2, width: token, borderRadius: vars.radius.sm }}
      />
    </div>
  );
}
