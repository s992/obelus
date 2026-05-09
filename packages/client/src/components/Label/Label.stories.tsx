import type { Meta, StoryObj } from '@storybook/react-vite';

import { Label } from './Label';

const meta = {
  title: 'Components/Label',
  component: Label,
  args: { children: 'Email address' },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: { hasError: true },
};
