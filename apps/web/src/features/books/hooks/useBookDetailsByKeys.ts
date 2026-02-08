import { trpc } from "@/api/trpc";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

export const normalizeBookKeys = (keys: string[]) => [...new Set(keys)].sort();

export const useBookDetailsByKeys = (keys: string[]) => {
  const normalizedKeys = normalizeBookKeys(keys);

  return useQuery({
    queryKey: queryKeys.bookDetailsByKeys(normalizedKeys),
    queryFn: () => trpc.books.detailsByKeys.query({ keys: normalizedKeys }),
    enabled: normalizedKeys.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};
