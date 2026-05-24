import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormDecorator } from '@/components/_storybook/FormDecorator';

import { DatePicker } from './DatePicker';

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  args: {},
} satisfies Meta<typeof DatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Start Date' },
  render: (args) => (
    <FormDecorator defaultValues={{ startDate: new Date() }}>
      {(form) => (
        <form.AppForm>
          <form.AppField name="startDate">{(field: any) => <field.DatePicker {...args} />}</form.AppField>
        </form.AppForm>
      )}
    </FormDecorator>
  ),
};
