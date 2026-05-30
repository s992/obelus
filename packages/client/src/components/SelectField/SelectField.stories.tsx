import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormDecorator } from '@/components/_storybook/FormDecorator';
import { Select } from '@/components/Select';

import { SelectField } from './SelectField';

const selectItems = (
  <>
    <Select.Item id="fiction">Fiction</Select.Item>
    <Select.Item id="non-fiction">Non-fiction</Select.Item>
    <Select.Item id="sci-fi">Science Fiction</Select.Item>
  </>
);

const meta = {
  title: 'Components/SelectField',
  component: SelectField,
} satisfies Meta<typeof SelectField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Genre', children: selectItems },
  render: (args) => (
    <FormDecorator defaultValues={{ genre: '' }}>
      {(form) => (
        <form.AppForm>
          <form.AppField name="genre">{(field: any) => <field.Select {...args} />}</form.AppField>
        </form.AppForm>
      )}
    </FormDecorator>
  ),
};

export const WithDefaultValue: Story = {
  args: { label: 'Genre', children: selectItems },
  render: (args) => (
    <FormDecorator defaultValues={{ genre: 'fiction' }}>
      {(form) => (
        <form.AppForm>
          <form.AppField name="genre">{(field: any) => <field.Select {...args} />}</form.AppField>
        </form.AppForm>
      )}
    </FormDecorator>
  ),
};
