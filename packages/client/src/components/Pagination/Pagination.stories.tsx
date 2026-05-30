import type { Meta, StoryObj } from '@storybook/react-vite';

import { typography } from '@/style';

import { Pagination } from './Pagination';

type Item = { id: number; name: string };

const items: Item[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Book ${i + 1}`,
}));

const renderList = (records: unknown[]) => (
  <ul className={typography.body}>
    {(records as Item[]).map((r) => (
      <li key={r.id}>{r.name}</li>
    ))}
  </ul>
);

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  args: {
    children: renderList,
    records: items,
    totalRecords: 10,
    pageSize: 3,
    hasNextPage: false,
    onFetchNextPage: () => Promise.resolve(),
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SinglePage: Story = {
  args: {
    records: items.slice(0, 2),
    totalRecords: 2,
    pageSize: 5,
  },
};

export const WithNextPageFetch: Story = {
  args: {
    records: items.slice(0, 5),
    totalRecords: 15,
    pageSize: 5,
    hasNextPage: true,
    onFetchNextPage: () => new Promise<void>((resolve) => setTimeout(resolve, 500)),
  },
};
