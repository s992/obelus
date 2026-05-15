import { QueryClient } from '@tanstack/react-query';

let queryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 0,
          refetchOnWindowFocus: false,
        },
      },
    });
  }

  return queryClient;
}
