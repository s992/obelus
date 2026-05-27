import type { Meta, StoryObj } from '@storybook/react-vite';

import { FullContainerSpinner } from './FullContainerSpinner';

const meta = {
  title: 'Components/FullContainerSpinner',
  component: FullContainerSpinner,
} satisfies Meta<typeof FullContainerSpinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
