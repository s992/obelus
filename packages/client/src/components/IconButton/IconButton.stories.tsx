import type { Meta, StoryObj } from '@storybook/react-vite';
import { X } from 'lucide-react';

import { IconButton } from './IconButton';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tertiary: Story = {
  args: { 'aria-label': 'close', children: <X /> },
};
