import type { Meta, StoryObj } from '@storybook/react-vite';

import { Alert } from './Alert';
import { FormattedAlert } from './FormattedAlert';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  args: {
    variant: 'error',
    children: 'Something went wrong while saving your changes.',
  },
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Error: Story = {
  args: { variant: 'error' },
};

export const FormattedAlertError: Story = {
  render: () => (
    <FormattedAlert
      variant="error"
      title="Save failed"
      message="Something went wrong while saving your changes. Please try again."
    />
  ),
};
