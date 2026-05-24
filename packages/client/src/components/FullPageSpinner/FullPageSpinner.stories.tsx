import type { Meta, StoryObj } from '@storybook/react-vite';

import { FullPageSpinner } from './FullPageSpinner';

const meta = {
  title: 'Components/FullPageSpinner',
  component: FullPageSpinner,
} satisfies Meta<typeof FullPageSpinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
