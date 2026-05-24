import type { Meta, StoryObj } from '@storybook/react-vite';

import { RouterDecorator } from '@/components/_storybook/RouterDecorator';

import { AppHeader } from './AppHeader';

const meta = {
  title: 'Components/AppHeader',
  component: AppHeader,
  decorators: [
    (Story) => (
      <RouterDecorator>
        <Story />
      </RouterDecorator>
    ),
  ],
} satisfies Meta<typeof AppHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithChildren: Story = {
  args: { children: <span>User Menu</span> },
};
