import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/internal/preview-api';
import { fn } from 'storybook/test';

import { Search } from './Search';

const meta = {
  title: 'Components/Search',
  component: Search,
  args: { onChange: fn() },
} satisfies Meta<typeof Search>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'search by title or author', value: '' },
  render: (args) => {
    const [, setArgs] = useArgs();

    return (
      <Search
        {...args}
        onChange={(value) => {
          args.onChange(value);
          setArgs({ value });
        }}
      />
    );
  },
};

export const WithValue: Story = {
  args: { label: 'search by title or author', value: 'Cradle' },
  render: (args) => {
    const [, setArgs] = useArgs();

    return (
      <Search
        {...args}
        onChange={(value) => {
          args.onChange(value);
          setArgs({ value });
        }}
      />
    );
  },
};
