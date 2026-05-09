import type { Meta, StoryObj } from '@storybook/react-vite';

import { ValidationErrorList } from './ValidationErrorList';

const meta = {
  title: 'Components/ValidationErrorList',
  component: ValidationErrorList,
} satisfies Meta<typeof ValidationErrorList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    errors: ['Email is required', 'Must be a valid email address'],
  },
};

export const Empty: Story = {
  args: { errors: [] },
};
