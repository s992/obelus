import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@/components/Button';

import { ListHeader } from './ListHeader';

const meta = {
  title: 'Components/BookList/ListHeader',
  component: ListHeader,
  args: {
    title: 'Currently Reading',
    count: 12,
  },
} satisfies Meta<typeof ListHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithChildren: Story = {
  args: { title: 'Finished', count: 42 },
  render: (args) => (
    <ListHeader {...args}>
      <Button variant="secondary">Sort</Button>
    </ListHeader>
  ),
};

export const ZeroCount: Story = {
  args: { title: 'Planned', count: 0 },
};
