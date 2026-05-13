import type { Book } from '@obelus/shared/types';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BookCover } from './BookCover';

const baseBook: Book = {
  id: 1,
  title: 'Unsouled',
  author: 'Will Wight',
  coverImage: null,
  description: null,
  pages: 294,
  releaseDate: null,
  series: null,
  subTitle: null,
};

const bookWithCover: Book = {
  ...baseBook,
  coverImage: 'https://covers.openlibrary.org/b/id/12547191-L.jpg',
};

const meta = {
  title: 'Components/BookCover',
  component: BookCover,
  args: {
    book: bookWithCover,
  },
} satisfies Meta<typeof BookCover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithCover: Story = {};

export const WithoutCover: Story = {
  args: { book: baseBook },
};

export const Medium: Story = {
  args: { size: 'medium' },
};

export const Large: Story = {
  args: { size: 'large' },
};

export const XLarge: Story = {
  args: { size: 'xlarge' },
};
