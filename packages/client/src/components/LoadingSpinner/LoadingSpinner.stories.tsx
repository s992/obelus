import type { Meta, StoryObj } from '@storybook/react-vite';

import { LoadingSpinner } from './LoadingSpinner';

const meta = {
  title: 'Components/LoadingSpinner',
  component: LoadingSpinner,
} satisfies Meta<typeof LoadingSpinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: { size: 'small' },
};

export const Medium: Story = {
  args: { size: 'med' },
};

export const Large: Story = {
  args: { size: 'large' },
};

export const XLarge: Story = {
  args: { size: 'xlarge' },
};
