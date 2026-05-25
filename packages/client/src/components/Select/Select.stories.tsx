import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormDecorator } from '@/components/_storybook/FormDecorator';

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
    children: (
      <>
        <Select.Item>recently updated</Select.Item>
        <Select.Item>recently added</Select.Item>
        <Select.Item>title</Select.Item>
      </>
    ),
  },
  render: (args) => (
    <FormDecorator defaultValues={{ sortOrder: '' }}>
      {(form) => (
        <form.AppForm>
          <form.AppField name="sortOrder">{(field: any) => <field.Select {...args} />}</form.AppField>
        </form.AppForm>
      )}
    </FormDecorator>
  ),
};
