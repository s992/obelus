import type { Meta, StoryObj } from '@storybook/react-vite';

import { TitleAuthorStack } from './TitleAuthorStack';

const meta = {
  title: 'Components/TitleAuthorStack',
  component: TitleAuthorStack,
  args: {
    title: 'Unsouled',
    author: 'Will Wight',
  },
} satisfies Meta<typeof TitleAuthorStack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MissingTitle: Story = {
  args: { title: null },
};

export const MissingAuthor: Story = {
  args: { author: null },
};

export const MissingBoth: Story = {
  args: { title: null, author: null },
};
