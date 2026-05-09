import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: 'Submit',
    variant: 'primary',
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary' },
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Tertiary: Story = {
  args: { variant: 'tertiary' },
};

export const Underlined: Story = {
  args: { variant: 'underlined' },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const Processing: Story = {
  args: { isProcessing: true },
};
