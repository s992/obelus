import { createFileRoute } from '@tanstack/react-router';

import { BookDetail } from '../../../pages/BookDetail';

export const Route = createFileRoute('/_authenticated/book/$bookId')({
  component: BookDetail,
});
