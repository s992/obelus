import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { UnreadBookActions } from './UnreadBookActions';

const meta = {
  title: 'Components/UnreadBookActions',
  component: UnreadBookActions,
  args: {
    onAction: fn(),
  },
} satisfies Meta<typeof UnreadBookActions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: { layout: 'horizontal' },
};

export const Vertical: Story = {
  args: { layout: 'vertical' },
};

export const HorizontalProcessing: Story = {
  args: { layout: 'horizontal', isProcessing: true },
};

export const VerticalProcessing: Story = {
  args: { layout: 'vertical', isProcessing: true },
};
