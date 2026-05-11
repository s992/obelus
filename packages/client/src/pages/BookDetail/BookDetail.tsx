import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';

import { useTRPC } from '../../client';

export function BookDetail() {
  const { bookId } = useParams({ from: '/_authenticated/book/$bookId' });
  const trpc = useTRPC();
  const { data: book, isLoading } = useQuery(trpc.book.byId.queryOptions({ id: parseInt(bookId) }));

  console.log(book);

  return null;
}
