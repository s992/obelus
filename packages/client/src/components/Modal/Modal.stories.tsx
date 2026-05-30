import type { Meta, StoryObj } from '@storybook/react-vite';
import { DialogTrigger } from 'react-aria-components';

import { Button } from '@/components/Button';
import { typography } from '@/style';

import { Modal } from './Modal';

const meta = {
  title: 'Components/Modal',
  component: Modal,
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Example modal',
    children: <p className={typography.body}>Modal content goes here.</p>,
  },
  render: (args) => (
    <DialogTrigger>
      <Button>Open modal</Button>
      <Modal {...args} />
    </DialogTrigger>
  ),
};

export const WithLongContent: Story = {
  args: {
    label: 'Long content modal',
    children: (
      <div className={typography.body}>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
          magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
          consequat.
        </p>
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p>
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem
          aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
        </p>
        <p>
          Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni
          dolores eos qui ratione voluptatem sequi nesciunt.
        </p>
      </div>
    ),
  },
  render: (args) => (
    <DialogTrigger>
      <Button>Open modal</Button>
      <Modal {...args} />
    </DialogTrigger>
  ),
};
