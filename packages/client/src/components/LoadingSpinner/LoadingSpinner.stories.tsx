import type { Meta, StoryObj } from '@storybook/react-vite';

import { LoadingSpinner } from './LoadingSpinner';

const meta = {
  title: 'Components/LoadingSpinner',
  component: LoadingSpinner,
  args: { size: 'button' },
} satisfies Meta<typeof LoadingSpinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Button: Story = {
  args: { size: 'button' },
};
