import type { Meta, StoryObj } from '@storybook/react-vite';

import { Select } from './';

const meta = {
  title: 'Components/Select',
  component: Select,
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'sort order',
    buttonValue: 'sort by',
    children: (
      <>
        <Select.Item>recently updated</Select.Item>
        <Select.Item>recently added</Select.Item>
        <Select.Item>title</Select.Item>
      </>
    ),
  },
};
