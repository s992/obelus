import type { Meta, StoryObj } from '@storybook/react-vite';

import { LoadError } from './LoadError';

const meta = {
  title: 'Components/LoadError',
  component: LoadError,
} satisfies Meta<typeof LoadError>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Custom: Story = {
  args: {
    title: 'Book not found',
    message: 'The book you are looking for does not exist.',
  },
};
