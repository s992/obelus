import type { Meta, StoryObj } from '@storybook/react-vite';

import { Table } from './';

const meta = {
  title: 'Components/Table',
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

const rows = [
  { title: 'Unsouled', author: 'Will Wight', pages: 294 },
  { title: 'Dune', author: 'Frank Herbert', pages: 688 },
  { title: 'Neuromancer', author: 'William Gibson', pages: 271 },
];

const TableContent = () => (
  <>
    <Table.Header>
      <Table.Column isRowHeader>Title</Table.Column>
      <Table.Column>Author</Table.Column>
      <Table.Column>Pages</Table.Column>
    </Table.Header>
    <Table.Body>
      {rows.map((row) => (
        <Table.Row key={row.title}>
          <Table.Cell>{row.title}</Table.Cell>
          <Table.Cell>{row.author}</Table.Cell>
          <Table.Cell>{row.pages}</Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </>
);

export const Default: Story = {
  render: () => (
    <Table aria-label="Books">
      <TableContent />
    </Table>
  ),
};

export const Loading: Story = {
  render: () => (
    <Table aria-label="Books" isLoading>
      <TableContent />
    </Table>
  ),
};

export const Empty: Story = {
  render: () => (
    <Table aria-label="Books">
      <Table.Header>
        <Table.Column isRowHeader>Title</Table.Column>
        <Table.Column>Author</Table.Column>
        <Table.Column>Pages</Table.Column>
      </Table.Header>
      <Table.Body>{[]}</Table.Body>
    </Table>
  ),
};
