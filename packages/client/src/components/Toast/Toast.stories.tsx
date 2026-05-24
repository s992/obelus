import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@/components/Button';

import { toastQueue } from './queue';
import { ToastRegion } from './ToastRegion';

const meta = {
  title: 'Components/Toast',
  component: ToastRegion,
} satisfies Meta<typeof ToastRegion>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <Button
        onPress={() =>
          toastQueue.add({
            variant: 'error',
            title: 'Save failed',
            message: 'Something went wrong while saving your changes.',
          })
        }
      >
        Show toast
      </Button>
      <ToastRegion />
    </>
  ),
};

export const Success: Story = {
  render: () => (
    <>
      <Button
        onPress={() =>
          toastQueue.add({
            variant: 'success',
            title: 'Saved',
            message: 'Your changes have been saved.',
          })
        }
      >
        Show toast
      </Button>
      <ToastRegion />
    </>
  ),
};

export const LongMessage: Story = {
  render: () => (
    <>
      <Button
        onPress={() =>
          toastQueue.add({
            variant: 'error',
            title: 'Import failed',
            message:
              'The file you uploaded could not be processed. Please check that it is a valid CSV file with the correct headers and try again. If the problem persists, contact support.',
          })
        }
      >
        Show toast
      </Button>
      <ToastRegion />
    </>
  ),
};
