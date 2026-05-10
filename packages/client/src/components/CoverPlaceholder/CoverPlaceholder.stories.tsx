import type { Meta, StoryObj } from '@storybook/react-vite';

import { CoverPlaceholder } from './CoverPlaceholder';

const meta = {
  title: 'Components/CoverPlaceholder',
  component: CoverPlaceholder,
} satisfies Meta<typeof CoverPlaceholder>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { author: 'Wight', title: 'Unsouled' },
};

export const Large: Story = {
  args: { author: 'Wight', title: 'Unsouled', size: 'large' },
};

export const LongTitleDefault: Story = {
  args: {
    author: 'Zetter',
    title: "Countdown to Zero Day: Stuxnet and the Launch of the World's First Digital Weapon",
  },
};

export const LongTitleLarge: Story = {
  args: {
    author: 'Zetter',
    title: "Countdown to Zero Day: Stuxnet and the Launch of the World's First Digital Weapon",
    size: 'large',
  },
};
