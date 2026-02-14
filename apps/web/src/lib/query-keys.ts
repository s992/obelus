export const queryKeys = {
  me: ["me"] as const,
  reading: ["reading"] as const,
  toRead: ["to-read"] as const,
  report: ["report"] as const,
  bookSearch: (query: string) => ["book-search", query] as const,
  bookDetail: (key: string | null) => ["book-detail", key] as const,
  bookDetailsByKeys: (keys: string[]) => ["book-details-by-keys", ...keys] as const,
  publicCollection: (userId: string) => ["public-collection", userId] as const,
  goodreadsImports: ["goodreads-imports"] as const,
  goodreadsImport: (importId: string | null) => ["goodreads-import", importId] as const,
};
