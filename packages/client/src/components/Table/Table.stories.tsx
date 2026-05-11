import type { Meta, StoryObj } from '@storybook/react-vite';

import { CoverPlaceholder } from '../BookCover/CoverPlaceholder';
import { Table } from '.';

const meta = {
  title: 'Components/Table',
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => {
    return (
      <Table>
        <Table.Header>
          <Table.Column />
          <Table.Column>title · author</Table.Column>
          <Table.Column>published</Table.Column>
          <Table.Column>judgment</Table.Column>
          <Table.Column>notes</Table.Column>
          <Table.Column>last touched</Table.Column>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>
              <CoverPlaceholder author="Wight" title="Unsouled" />
            </Table.Cell>
            <Table.Cell>Unsouled</Table.Cell>
            <Table.Cell>2016</Table.Cell>
            <Table.Cell>accepted</Table.Cell>
            <Table.Cell>0</Table.Cell>
            <Table.Cell>10 may 2026</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>
              <CoverPlaceholder author="Wight" title="Soulsmith" />
            </Table.Cell>
            <Table.Cell>Soulsmith</Table.Cell>
            <Table.Cell>2016</Table.Cell>
            <Table.Cell>accepted</Table.Cell>
            <Table.Cell>0</Table.Cell>
            <Table.Cell>10 may 2026</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>
              <CoverPlaceholder author="Wight" title="Blackflame" />
            </Table.Cell>
            <Table.Cell>Blackflame</Table.Cell>
            <Table.Cell>2017</Table.Cell>
            <Table.Cell>accepted</Table.Cell>
            <Table.Cell>0</Table.Cell>
            <Table.Cell>10 may 2026</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    );
  },
};

export const EmptyState: Story = {
  args: {},
  render: () => {
    return (
      <Table>
        <Table.Header>
          <Table.Column />
          <Table.Column>title · author</Table.Column>
          <Table.Column>published</Table.Column>
          <Table.Column>judgment</Table.Column>
          <Table.Column>notes</Table.Column>
          <Table.Column>last touched</Table.Column>
        </Table.Header>
        <Table.Body renderEmptyState={() => 'No records found.'}>{[]}</Table.Body>
      </Table>
    );
  },
};
