import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormattedMessage } from 'react-intl';

import { DatePicker } from './DatePicker';

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  args: {
    label: <FormattedMessage defaultMessage="Start Date" />,
  },
} satisfies Meta<typeof DatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
