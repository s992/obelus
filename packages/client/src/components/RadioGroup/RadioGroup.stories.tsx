import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormDecorator } from '../_storybook/FormDecorator';
import { RadioGroup } from './RadioGroup';

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  args: {},
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Judgment',
    options: [
      { value: 'accepted', label: 'accepted' },
      { value: 'mixed', label: 'mixed' },
      { value: 'rejected', label: 'rejected' },
    ],
  },
  render: (args) => (
    <FormDecorator defaultValues={{ startDate: new Date() }}>
      {(form) => (
        <form.AppForm>
          <form.AppField name="startDate">{(field: any) => <field.RadioGroup {...args} />}</form.AppField>
        </form.AppForm>
      )}
    </FormDecorator>
  ),
};
