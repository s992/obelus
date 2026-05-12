import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormDecorator } from '../_storybook/FormDecorator';
import { Button } from '../Button';
import { Form } from './Form';

const meta = {
  title: 'Components/Form',
  component: Form,
} satisfies Meta<typeof Form>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Stacked: Story = {
  render: () => (
    <FormDecorator defaultValues={{ email: '', name: '' }}>
      {(form) => (
        <form.AppForm>
          <Form>
            <form.AppField name="email">{(field: any) => <field.TextField label="Email" />}</form.AppField>
            <form.AppField name="name">{(field: any) => <field.TextField label="Name" />}</form.AppField>
            <Button type="submit">Submit</Button>
          </Form>
        </form.AppForm>
      )}
    </FormDecorator>
  ),
};
