import type { Meta, StoryObj } from '@storybook/react-vite';

import { Calendar } from './Calendar';

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  args: {},
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
