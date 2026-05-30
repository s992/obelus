import type { Meta, StoryObj } from '@storybook/react-vite';

import { typography } from '@/style';

import { StatusDot } from './StatusDot';

const meta = {
  title: 'Components/StatusDot',
  component: StatusDot,
  render: (args) => (
    <span className={typography.body}>
      <StatusDot {...args} /> Status indicator
    </span>
  ),
} satisfies Meta<typeof StatusDot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Good: Story = {
  args: { variant: 'good' },
};

export const Bad: Story = {
  args: { variant: 'bad' },
};

export const Warn: Story = {
  args: { variant: 'warn' },
};

export const CurrentColor: Story = {
  args: { variant: 'currentColor' },
};
