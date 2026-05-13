import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ThemeToggle } from './ThemeToggle';

const meta = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  args: {
    onChange: fn(),
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Light: Story = {
  args: { currentTheme: 'light' },
};

export const Dark: Story = {
  args: { currentTheme: 'dark' },
};
