import type { Meta, StoryObj } from '@storybook/react-vite';
import { DialogTrigger } from 'react-aria-components';

import { Button } from '@/components/Button';

import { Popover } from './Popover';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  args: {},
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    return (
      <DialogTrigger>
        <Button>toggle</Button>
        <Popover {...args}>my content</Popover>
      </DialogTrigger>
    );
  },
};
