import z from 'zod';

import { client } from '../gql/client';
import { privateProcedure, router } from '../trpc/trpc';

export const bookRouter = router({
  search: privateProcedure.input(z.object({ query: z.string().nonempty() })).mutation(async ({ input }) => {
    const searchResult = await client.SearchBooks({ query: input.query });
    const ids = (searchResult.search?.ids ?? []).filter((id) => id !== null);

    if (!ids) {
      return [];
    }

    const { books } = await client.GetBooksByIds({ ids });

    return books;
  }),
  byId: privateProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const { books } = await client.GetBooksByIds({ ids: [input.id] });

    return books[0];
  }),
});
