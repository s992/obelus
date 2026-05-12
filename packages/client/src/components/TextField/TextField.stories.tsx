import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormDecorator } from '../_storybook/FormDecorator';
import { TextField } from './TextField';

const meta = {
  title: 'Components/TextField',
  component: TextField,
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Email' },
  render: (args) => (
    <FormDecorator defaultValues={{ email: '' }}>
      {(form) => (
        <form.AppForm>
          <form.AppField name="email">{(field: any) => <field.TextField {...args} />}</form.AppField>
        </form.AppForm>
      )}
    </FormDecorator>
  ),
};
