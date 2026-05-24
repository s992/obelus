import type { Meta, StoryObj } from '@storybook/react-vite';

import { RouterDecorator } from '@/components/_storybook/RouterDecorator';

import { Link } from './Link';

const meta = {
  title: 'Components/Link',
  component: Link,
  decorators: [
    (Story) => (
      <RouterDecorator>
        <Story />
      </RouterDecorator>
    ),
  ],
} satisfies Meta<typeof Link>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { to: '/', children: 'Go home' },
};
